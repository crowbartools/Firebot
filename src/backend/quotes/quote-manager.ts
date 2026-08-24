import type { Database } from "@tursodatabase/database";
import Datastore from "@seald-io/nedb";
import { TypedEmitter } from "tiny-typed-emitter";
import fsp from "fs/promises";
import fs from "fs";

import type { Quote } from "../../types";

import { TursoConnectionRegistry } from "../database/turso-connection-registry";
import { ProfileManager } from "../common/profile-manager";
import frontendCommunicator from "../common/frontend-communicator";
import { LoggerCache } from "../logger-cache";

interface QuoteEventData {
    quote: Partial<Quote>;
}

interface DateConfig {
    day: number;
    month: number;
    year: number;
}

interface LegacyQuoteDoc {
    _id: number | "__autoid__";
    seq?: number;
    text?: string;
    originator?: string;
    creator?: string;
    game?: string;
    createdAt?: string;
}

interface QuoteRow {
    id: number;
    text: string;
    originator: string;
    creator: string;
    game: string;
    created_at: string | null;
}

const QUOTES_TABLE = "quotes";
const META_TABLE = "quote_meta";
const AUTOID_KEY = "autoid";

class QuoteManager {
    private logger = LoggerCache.getLogger("Quotes");
    private db: Database;

    events = new TypedEmitter<{
        "created-item": (data: QuoteEventData) => void;
        "updated-item": (data: QuoteEventData) => void;
        "deleted-item": (data: QuoteEventData) => void;
    }>();

    constructor() {
        frontendCommunicator.on("add-quote", (quote: Quote) => {
            void this.addQuote(quote);
        });

        frontendCommunicator.on("update-quote", (quote: Quote) => {
            void this.updateQuote(quote, true);
        });

        frontendCommunicator.on("delete-quote", (quoteId: number) => {
            void this.removeQuote(quoteId, true);
        });

        frontendCommunicator.onAsync("get-all-quotes", async () => {
            const quotes = await this.getAllQuotes();
            return quotes ?? [];
        });

        frontendCommunicator.on("recalc-quote-ids", () => {
            void this.recalculateQuoteIds();
        });

        frontendCommunicator.onAsync("quotes:export-quotes-to-file",
            async (filepath: string) => await this.exportQuotesToFile(filepath)
        );
    }

    private regExpEscape(input: string) {
        return input.replace(/[$^|.*+?(){}\\[\]]/g, '\\$&');
    }

    private buildSearchPattern(term: string, wholeWord = false): string {
        const escaped = this.regExpEscape(term);
        return wholeWord ? `(?i)\\b${escaped}\\b` : `(?i)${escaped}`;
    }

    private rowToQuote(row: QuoteRow): Quote {
        return {
            _id: row.id,
            text: row.text,
            originator: row.originator,
            creator: row.creator,
            game: row.game,
            createdAt: row.created_at ?? undefined
        };
    }

    async loadQuoteDatabase(): Promise<void> {
        try {
            this.db = await TursoConnectionRegistry.getConnection("quotes");
            await this.createSchema();
            await this.migrateFromNeDb();
        } catch (error) {
            const err = error as Error;
            this.logger.error("Error Loading Database: ", err.message);
        }
    }

    private async createSchema(): Promise<void> {
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS ${QUOTES_TABLE} (
                id INTEGER PRIMARY KEY,
                text TEXT,
                originator TEXT,
                creator TEXT,
                game TEXT,
                created_at TEXT
            )
        `);
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS ${META_TABLE} (
                key TEXT PRIMARY KEY,
                seq INTEGER
            )
        `);
    }

    private async migrateFromNeDb(): Promise<void> {
        // Don't migrate if the table already has data
        if ((await this.getQuoteCount()) > 0) {
            return;
        }

        const nedbPath = ProfileManager.getPathInProfile("db/quotes.db");
        if (!fs.existsSync(nedbPath)) {
            return;
        }

        this.logger.info("Migrating legacy NeDB quotes database to Turso...");

        try {
            const legacy = new Datastore({ filename: nedbPath });
            await legacy.loadDatabaseAsync();

            const docs = await legacy.findAsync({}) as LegacyQuoteDoc[];

            const autoIdDoc = docs.find(d => d._id === "__autoid__");
            const quotes = docs.filter(d => d._id !== "__autoid__") as Quote[];

            const insertAll = this.db.transaction(async () => {
                for (const quote of quotes) {
                    await this.insertQuoteRow(quote);
                }

                // Preserve the autoincrement counter so newly added quotes don't
                // reuse ids. Fall back to the highest existing id if there was no
                // autoid doc for some reason
                const highestId = quotes.reduce((max, q) => Math.max(max, q._id ?? 0), 0);
                const seq = autoIdDoc?.seq ?? highestId;
                await this.setQuoteIdIncrementer(seq);
            });
            await insertAll();

            // Keep the original file around just in case
            await fsp.rename(nedbPath, `${nedbPath}.migrated`);

            this.logger.info(`Migrated ${quotes.length} quotes from NeDB to Turso.`);
        } catch (error) {
            const err = error as Error;
            this.logger.error("Error migrating quotes from NeDB to Turso: ", err.message);
        }
    }

    private async insertQuoteRow(quote: Quote): Promise<void> {
        await this.db.run(
            `INSERT OR REPLACE INTO ${QUOTES_TABLE} (id, text, originator, creator, game, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                quote._id,
                quote.text ?? null,
                quote.originator ?? null,
                quote.creator ?? null,
                quote.game ?? null,
                quote.createdAt ?? null
            ]
        );
    }

    private async getQuoteCount(): Promise<number> {
        const row = await this.db.get(
            `SELECT COUNT(*) AS count FROM ${QUOTES_TABLE}`
        ) as { count: number } | undefined;
        return row?.count ?? 0;
    }

    async getCurrentQuoteId(): Promise<number> {
        try {
            const row = await this.db.get(
                `SELECT seq FROM ${META_TABLE} WHERE key = ?`,
                [AUTOID_KEY]
            ) as { seq: number } | undefined;
            return row != null ? Number(row.seq) : null;
        } catch {
            return null;
        }
    }

    async getNextQuoteId(): Promise<number> {
        try {
            // Ensure the counter row exists, then atomically increment it.
            await this.db.run(
                `INSERT INTO ${META_TABLE} (key, seq) VALUES (?, 0)
                 ON CONFLICT(key) DO NOTHING`,
                [AUTOID_KEY]
            );
            const row = await this.db.get(
                `UPDATE ${META_TABLE} SET seq = seq + 1 WHERE key = ? RETURNING seq`,
                [AUTOID_KEY]
            ) as { seq: number } | undefined;
            return row != null ? Number(row.seq) : null;
        } catch {
            return null;
        }
    }

    async setQuoteIdIncrementer(number: number): Promise<number> {
        try {
            await this.db.run(
                `INSERT INTO ${META_TABLE} (key, seq) VALUES (?, ?)
                 ON CONFLICT(key) DO UPDATE SET seq = excluded.seq`,
                [AUTOID_KEY, number]
            );
            return number;
        } catch {
            return null;
        }
    }

    async addQuote(quote: Quote): Promise<number> {
        try {
            // If no/invalid ID is specified, get the next one
            if (!quote._id || isNaN(quote._id)) {
                const newQuoteId = await this.getNextQuoteId();
                if (newQuoteId == null) {
                    this.logger.error("Unable to add quote as we could not generate a new ID");
                    return null;
                }

                quote._id = newQuoteId;

            // Otherwise, use the ID passed in
            } else {
            // If the specified ID is higher than the next autoincrement,
            // set the autoincrement to the new ID
                const highestQuoteId = await this.getCurrentQuoteId();
                if (highestQuoteId < quote._id) {
                    await this.setQuoteIdIncrementer(quote._id);
                }
            }

            await this.insertQuoteRow(quote);

            this.events.emit("created-item", { quote });
            frontendCommunicator.send("quotes-update");
            return quote._id;
        } catch (error) {
            const err = error as Error;
            this.logger.error("Error adding quote: ", err.message);
            return null;
        }
    }

    async addQuotes(quotes: Quote[]): Promise<void> {
        try {
            for (const quote of quotes) {
                const newQuoteId = await this.getNextQuoteId();

                if (newQuoteId == null) {
                    this.logger.error("Unable to add quote as we could not generate a new ID");
                    continue;
                }

                quote._id = newQuoteId;
                await this.insertQuoteRow(quote);

                this.events.emit("created-item", { quote });
            }

            frontendCommunicator.send("quotes-update");
        } catch (error) {
            const err = error as Error;
            this.logger.error("Error adding quotes: ", err.message);
            throw error;
        }
    }

    async updateQuote(quote: Quote, dontSendUiUpdateEvent = false): Promise<Quote> {
        try {
            await this.db.run(
                `UPDATE ${QUOTES_TABLE}
                 SET text = ?, originator = ?, creator = ?, game = ?, created_at = ?
                 WHERE id = ?`,
                [
                    quote.text ?? null,
                    quote.originator ?? null,
                    quote.creator ?? null,
                    quote.game ?? null,
                    quote.createdAt ?? null,
                    quote._id
                ]
            );

            const updatedQuote = await this.getQuote(quote._id);

            this.events.emit("updated-item", { quote: updatedQuote });

            if (!dontSendUiUpdateEvent) {
                frontendCommunicator.send("quotes-update");
            }

            return updatedQuote;
        } catch (error) {
            const err = error as Error;
            this.logger.error("Error updating quote: ", err.message);
            return null;
        }
    }

    async removeQuote(quoteId: number, dontSendUiUpdateEvent = false): Promise<void> {
        try {
            await this.db.run(`DELETE FROM ${QUOTES_TABLE} WHERE id = ?`, [quoteId]);

            this.events.emit("deleted-item", { quote: { _id: quoteId } });

            if (!dontSendUiUpdateEvent) {
                frontendCommunicator.send("quotes-update");
            }
        } catch (error) {
            const err = error as Error;
            this.logger.warn("Error while removing quote", err);
        }
    }

    async getQuote(quoteId: number): Promise<Quote> {
        try {
            const row = await this.db.get(
                `SELECT * FROM ${QUOTES_TABLE} WHERE id = ?`,
                [quoteId]
            ) as QuoteRow | undefined;
            return row != null ? this.rowToQuote(row) : null;
        } catch {
            return null;
        }
    }

    private async getRandomQuoteWhere(whereClause: string, params: Array<string | number>): Promise<Quote> {
        const row = await this.db.get(
            `SELECT * FROM ${QUOTES_TABLE} WHERE ${whereClause} ORDER BY random() LIMIT 1`,
            params
        ) as QuoteRow | undefined;
        return row != null ? this.rowToQuote(row) : undefined;
    }

    async getRandomQuoteByDate(dateConfig: DateConfig): Promise<Quote> {
        try {
            // created_at is stored as an ISO8601 string, which strftime parses
            // natively to pull out the date parts.
            const conditions = [
                "CAST(strftime('%m', created_at) AS INTEGER) = ?",
                "CAST(strftime('%d', created_at) AS INTEGER) = ?"
            ];
            const params: number[] = [dateConfig.month, dateConfig.day];

            if (dateConfig.year) {
                // a 2-digit year is interpreted as 20YY
                const fullYear = dateConfig.year.toString().length === 2
                    ? 2000 + dateConfig.year
                    : dateConfig.year;
                conditions.push("CAST(strftime('%Y', created_at) AS INTEGER) = ?");
                params.push(fullYear);
            }

            return await this.getRandomQuoteWhere(conditions.join(" AND "), params);
        } catch {
            return null;
        }
    }

    async getRandomQuoteByAuthor(author: string): Promise<Quote> {
        try {
            return await this.getRandomQuoteWhere("lower(originator) = lower(?)", [author]);
        } catch {
            return null;
        }
    }

    async getRandomQuoteByGame(gameSearch: string) {
        try {
            return await this.getRandomQuoteWhere("game REGEXP ?", [this.buildSearchPattern(gameSearch)]);
        } catch {
            return null;
        }
    }

    async getRandomQuoteContainingText(text: string): Promise<Quote> {
        try {
            return await this.getRandomQuoteWhere(`"text" REGEXP ?`, [this.buildSearchPattern(text, true)]);
        } catch {
            return null;
        }
    }

    async getRandomQuote(): Promise<Quote> {
        try {
            const row = await this.db.get(
                `SELECT * FROM ${QUOTES_TABLE} ORDER BY random() LIMIT 1`
            ) as QuoteRow | undefined;
            return row != null ? this.rowToQuote(row) : undefined;
        } catch {
            return null;
        }
    }

    async getAllQuotes(): Promise<Quote[]> {
        try {
            const rows = await this.db.all(
                `SELECT * FROM ${QUOTES_TABLE} ORDER BY id`
            ) as QuoteRow[];
            return rows.map(row => this.rowToQuote(row));
        } catch {
            return null;
        }
    }

    async recalculateQuoteIds() {
        if (this.db == null) {
            return;
        }

        const quotes = await this.getAllQuotes();
        if (quotes == null) {
            return;
        }

        try {
            const renumber = this.db.transaction(async () => {
                await this.db.run(`DELETE FROM ${QUOTES_TABLE}`);

                let idCounter = 1;
                for (const quote of quotes) {
                    quote._id = idCounter;
                    await this.insertQuoteRow(quote);
                    this.events.emit("updated-item", { quote });
                    idCounter++;
                }

                await this.setQuoteIdIncrementer(idCounter - 1);
            });
            await renumber();
        } catch (error) {
            const err = error as Error;
            this.logger.error("Error recalculating quote ids: ", err.message);
            return;
        }

        frontendCommunicator.send("quotes-update");
    }

    async exportQuotesToFile(filepath: string): Promise<boolean> {
        try {
            const fileLines: string[] = [];
            const quotes = await this.getAllQuotes();

            const headers = [
                "ID",
                "Text",
                "Originator",
                "Creator",
                "Category",
                "Created"
            ];

            fileLines.push(headers.join(","));

            for (const quote of quotes) {
                fileLines.push(`${quote._id},"${quote.text.replaceAll(`"`, `""`)}",${quote.originator},${quote.creator},${quote.game},${quote.createdAt}`);
            }

            await fsp.writeFile(filepath, fileLines.join("\n"), { encoding: "utf8" });
            return true;
        } catch (error) {
            this.logger.error("Error exporting quotes to file", error);
        }

        return false;
    }
}

const manager = new QuoteManager();

export { manager as QuoteManager };
