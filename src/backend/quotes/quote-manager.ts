import type { DuckDBConnection } from "@duckdb/node-api";
import Datastore from "@seald-io/nedb";
import { TypedEmitter } from "tiny-typed-emitter";
import fsp from "fs/promises";
import fs from "fs";

import type { Quote } from "../../types";

import { DuckDbConnectionRegistry } from "../database/duckdb-connection-registry";
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
    private db: DuckDBConnection;

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
            this.db = await DuckDbConnectionRegistry.getConnection("quotes");
            await this.createSchema();
            await this.migrateFromNeDb();
        } catch (error) {
            const err = error as Error;
            this.logger.error("Error Loading Database: ", err.message);
        }
    }

    private async createSchema(): Promise<void> {
        await this.db.run(`
            CREATE TABLE IF NOT EXISTS ${QUOTES_TABLE} (
                id INTEGER PRIMARY KEY,
                text VARCHAR,
                originator VARCHAR,
                creator VARCHAR,
                game VARCHAR,
                created_at VARCHAR
            )
        `);
        await this.db.run(`
            CREATE TABLE IF NOT EXISTS ${META_TABLE} (
                key VARCHAR PRIMARY KEY,
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

        this.logger.info("Migrating legacy NeDB quotes database to DuckDB...");

        try {
            const legacy = new Datastore({ filename: nedbPath });
            await legacy.loadDatabaseAsync();

            const docs = await legacy.findAsync({}) as LegacyQuoteDoc[];

            const autoIdDoc = docs.find(d => d._id === "__autoid__");
            const quotes = docs.filter(d => d._id !== "__autoid__") as Quote[];

            await this.db.run("BEGIN TRANSACTION");
            try {
                for (const quote of quotes) {
                    await this.insertQuoteRow(quote);
                }

                // Preserve the autoincrement counter so newly added quotes don't
                // reuse ids. Fall back to the highest existing id if there was no
                // autoid doc for some reason
                const highestId = quotes.reduce((max, q) => Math.max(max, q._id ?? 0), 0);
                const seq = autoIdDoc?.seq ?? highestId;
                await this.setQuoteIdIncrementer(seq);

                await this.db.run("COMMIT");
            } catch (error) {
                await this.db.run("ROLLBACK");
                throw error;
            }

            // Keep the original file around just in case
            await fsp.rename(nedbPath, `${nedbPath}.migrated`);

            this.logger.info(`Migrated ${quotes.length} quotes from NeDB to DuckDB.`);
        } catch (error) {
            const err = error as Error;
            this.logger.error("Error migrating quotes from NeDB to DuckDB: ", err.message);
        }
    }

    private async insertQuoteRow(quote: Quote): Promise<void> {
        await this.db.run(
            `INSERT OR REPLACE INTO ${QUOTES_TABLE} (id, text, originator, creator, game, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
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
        const reader = await this.db.runAndReadAll(
            `SELECT CAST(COUNT(*) AS INTEGER) AS count FROM ${QUOTES_TABLE}`
        );
        const rows = reader.getRowObjects() as Array<{ count: number }>;
        return rows[0]?.count ?? 0;
    }

    async getCurrentQuoteId(): Promise<number> {
        try {
            const reader = await this.db.runAndReadAll(
                `SELECT seq FROM ${META_TABLE} WHERE key = $1`,
                [AUTOID_KEY]
            );
            const rows = reader.getRowObjects() as Array<{ seq: number }>;
            return rows.length ? Number(rows[0].seq) : null;
        } catch {
            return null;
        }
    }

    async getNextQuoteId(): Promise<number> {
        try {
            // Ensure the counter row exists, then atomically increment it.
            await this.db.run(
                `INSERT INTO ${META_TABLE} (key, seq) VALUES ($1, 0)
                 ON CONFLICT (key) DO NOTHING`,
                [AUTOID_KEY]
            );
            const reader = await this.db.runAndReadAll(
                `UPDATE ${META_TABLE} SET seq = seq + 1 WHERE key = $1 RETURNING seq`,
                [AUTOID_KEY]
            );
            const rows = reader.getRowObjects() as Array<{ seq: number }>;
            return Number(rows[0].seq);
        } catch {
            return null;
        }
    }

    async setQuoteIdIncrementer(number: number): Promise<number> {
        try {
            await this.db.run(
                `INSERT INTO ${META_TABLE} (key, seq) VALUES ($1, $2)
                 ON CONFLICT (key) DO UPDATE SET seq = excluded.seq`,
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
                 SET text = $2, originator = $3, creator = $4, game = $5, created_at = $6
                 WHERE id = $1`,
                [
                    quote._id,
                    quote.text ?? null,
                    quote.originator ?? null,
                    quote.creator ?? null,
                    quote.game ?? null,
                    quote.createdAt ?? null
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
            await this.db.run(`DELETE FROM ${QUOTES_TABLE} WHERE id = $1`, [quoteId]);

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
            const reader = await this.db.runAndReadAll(
                `SELECT * FROM ${QUOTES_TABLE} WHERE id = $1`,
                [quoteId]
            );
            const rows = reader.getRowObjects() as unknown as QuoteRow[];
            return rows.length ? this.rowToQuote(rows[0]) : null;
        } catch {
            return null;
        }
    }

    private async getRandomQuoteWhere(whereClause: string, params: Array<string | number>): Promise<Quote> {
        const reader = await this.db.runAndReadAll(
            `SELECT * FROM ${QUOTES_TABLE} WHERE ${whereClause} ORDER BY random() LIMIT 1`,
            params
        );
        const rows = reader.getRowObjects() as unknown as QuoteRow[];
        return rows.length ? this.rowToQuote(rows[0]) : undefined;
    }

    async getRandomQuoteByDate(dateConfig: DateConfig): Promise<Quote> {
        try {
            const conditions = [
                "month(TRY_CAST(created_at AS TIMESTAMP)) = $1",
                "day(TRY_CAST(created_at AS TIMESTAMP)) = $2"
            ];
            const params: number[] = [dateConfig.month, dateConfig.day];

            if (dateConfig.year) {
                // a 2-digit year is interpreted as 20YY
                const fullYear = dateConfig.year.toString().length === 2
                    ? 2000 + dateConfig.year
                    : dateConfig.year;
                conditions.push(`year(TRY_CAST(created_at AS TIMESTAMP)) = $${params.length + 1}`);
                params.push(fullYear);
            }

            return await this.getRandomQuoteWhere(conditions.join(" AND "), params);
        } catch {
            return null;
        }
    }

    async getRandomQuoteByAuthor(author: string): Promise<Quote> {
        try {
            return await this.getRandomQuoteWhere("lower(originator) = lower($1)", [author]);
        } catch {
            return null;
        }
    }

    async getRandomQuoteByGame(gameSearch: string) {
        try {
            return await this.getRandomQuoteWhere(
                "regexp_matches(game, $1, 'i')",
                [this.regExpEscape(gameSearch)]
            );
        } catch {
            return null;
        }
    }

    async getRandomQuoteContainingText(text: string): Promise<Quote> {
        try {
            return await this.getRandomQuoteWhere(
                `regexp_matches("text", $1, 'i')`,
                [`\\b${this.regExpEscape(text)}\\b`]
            );
        } catch {
            return null;
        }
    }

    async getRandomQuote(): Promise<Quote> {
        try {
            const reader = await this.db.runAndReadAll(
                `SELECT * FROM ${QUOTES_TABLE} ORDER BY random() LIMIT 1`
            );
            const rows = reader.getRowObjects() as unknown as QuoteRow[];
            return rows.length ? this.rowToQuote(rows[0]) : undefined;
        } catch {
            return null;
        }
    }

    async getAllQuotes(): Promise<Quote[]> {
        try {
            const reader = await this.db.runAndReadAll(
                `SELECT * FROM ${QUOTES_TABLE} ORDER BY id`
            );
            const rows = reader.getRowObjects() as unknown as QuoteRow[];
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

        await this.db.run("BEGIN TRANSACTION");
        try {
            await this.db.run(`DELETE FROM ${QUOTES_TABLE}`);

            let idCounter = 1;
            for (const quote of quotes) {
                quote._id = idCounter;
                await this.insertQuoteRow(quote);
                this.events.emit("updated-item", { quote });
                idCounter++;
            }

            await this.setQuoteIdIncrementer(idCounter - 1);
            await this.db.run("COMMIT");
        } catch (error) {
            await this.db.run("ROLLBACK");
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
