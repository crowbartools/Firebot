import Datastore from "@seald-io/nedb";
import { TypedEmitter } from "tiny-typed-emitter";
import fsp from "fs/promises";

import type { Quote, QuoteAutoid } from "../../types/quotes";

import { ProfileManager } from "../common/profile-manager";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

interface QuoteEventData {
    quote: Partial<Quote>;
}

interface DateConfig {
    day: number;
    month: number;
    year: number;
}

class QuoteManager {
    private db: Datastore<Quote | QuoteAutoid>;

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

    async loadQuoteDatabase(): Promise<void> {
        const path = ProfileManager.getPathInProfile("db/quotes.db");
        this.db = new Datastore({ filename: path });
        try {
            await this.db.loadDatabaseAsync();
        } catch (error) {
            const err = error as Error;
            logger.error("Error Loading Database: ", err.message);
            logger.debug("Failed Database Path: ", path);
        }
    }

    async getCurrentQuoteId(): Promise<number> {
        try {
            const id: QuoteAutoid = await this.db.findOneAsync({ _id: "__autoid__" });
            return id.seq;
        } catch {
            return null;
        }
    }

    async getNextQuoteId(): Promise<number> {
        try {
            const result = await this.db.updateAsync(
                { _id: '__autoid__' },
                { $inc: { seq: 1 } },
                { upsert: true, returnUpdatedDocs: true }
            );

            return (result.affectedDocuments as QuoteAutoid).seq;
        } catch {
            return null;
        }
    }

    async setQuoteIdIncrementer(number: number): Promise<number> {
        try {
            const result = await this.db.updateAsync(
                { _id: '__autoid__' },
                { $inc: { seq: number } },
                { upsert: true, returnUpdatedDocs: true }
            );

            return (result.affectedDocuments as QuoteAutoid).seq;
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
                    logger.error("Unable to add quote as we could not generate a new ID");
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

            const newQuote = await this.db.insertAsync(quote);

            this.events.emit("created-item", { quote: newQuote });
            frontendCommunicator.send("quotes-update");
            return newQuote._id as number;
        } catch (error) {
            const err = error as Error;
            logger.error("QuoteDB: Error adding quote: ", err.message);
            return null;
        }
    }

    async addQuotes(quotes: Quote[]): Promise<void> {
        try {
            quotes.forEach(async (q) => {
                const newQuoteId = await this.getNextQuoteId();

                if (newQuoteId == null) {
                    logger.error("Unable to add quote as we could not generate a new ID");
                    return;
                }

                q._id = newQuoteId;
            });

            const newQuotes = await this.db.insertAsync(quotes);

            for (const quote of newQuotes) {
                this.events.emit("created-item", { quote });
            }

            frontendCommunicator.send("quotes-update");
        } catch (error) {
            const err = error as Error;
            logger.error("QuoteDB: Error adding quotes: ", err.message);
            throw error;
        }
    }

    async updateQuote(quote: Quote, dontSendUiUpdateEvent = false): Promise<Quote> {
        try {
            const { affectedDocuments } = await this.db.updateAsync(
                { _id: quote._id },
                quote,
                { returnUpdatedDocs: true }
            );
            const updatedQuote = affectedDocuments as Quote;

            this.events.emit("updated-item", { quote: updatedQuote });

            if (!dontSendUiUpdateEvent) {
                frontendCommunicator.send("quotes-update");
            }

            return updatedQuote;
        } catch (error) {
            const err = error as Error;
            logger.error("QuoteDB: Error updating quote: ", err.message);
            return null;
        }
    }

    async removeQuote(quoteId: number, dontSendUiUpdateEvent = false): Promise<void> {
        try {
            await this.db.removeAsync({ _id: quoteId }, {});

            this.events.emit("deleted-item", { quote: { _id: quoteId } });

            if (!dontSendUiUpdateEvent) {
                frontendCommunicator.send("quotes-update");
            }
        } catch (error) {
            const err = error as Error;
            logger.warn("Error while removing quote", err);
        }
    }

    async getQuote(quoteId: number): Promise<Quote> {
        try {
            return await this.db.findOneAsync({ _id: quoteId }) as Quote;
        } catch {
            return null;
        }
    }

    async getRandomQuoteByDate(dateConfig: DateConfig): Promise<Quote> {
        try {
            let regex = "^";
            if (dateConfig.year) {
                regex += dateConfig.year.toString().length === 2 ?
                    `20${dateConfig.year}-` :
                    `${dateConfig.year}-`;
            } else {
                regex += '\\d{4}-';
            }

            regex += dateConfig.month < 10 ? `${dateConfig.month.toString().padStart(2, "0")}-` : `${dateConfig.month}-`;
            regex += dateConfig.day < 10 ? `${dateConfig.day.toString().padStart(2, "0")}` : `${dateConfig.day}`;
            regex += "T";

            const datePattern = new RegExp(regex);
            const quotes = await this.db.findAsync({ createdAt: { $regex: datePattern } });

            if (!quotes.length) {
                return;
            }

            return quotes[Math.floor(Math.random() * quotes.length)] as Quote;
        } catch {
            return null;
        }
    }

    async getRandomQuoteByAuthor(author: string): Promise<Quote> {
        try {
            const quotes = await this.db.findAsync(
                {
                    originator: {
                        $regex: new RegExp(`^${this.regExpEscape(author)}$`, 'i')
                    }
                }
            );

            if (!quotes.length) {
                return;
            }

            return quotes[Math.floor(Math.random() * quotes.length)] as Quote;
        } catch {
            return null;
        }
    }

    async getRandomQuoteByGame(gameSearch: string) {
        try {
            const gamePattern = new RegExp(`${this.regExpEscape(gameSearch)}`, 'i');
            const quotes = await this.db.findAsync({ originator: { $regex: gamePattern } });

            if (!quotes.length) {
                return;
            }

            return quotes[Math.floor(Math.random() * quotes.length)] as Quote;
        } catch {
            return null;
        }
    }

    async getRandomQuoteContainingText(text: string): Promise<Quote> {
        try {
            const textPattern = new RegExp(`\\b${this.regExpEscape(text)}\\b`, 'i');
            const quotes = await this.db.findAsync({ text: { $regex: textPattern } });

            if (!quotes.length) {
                return;
            }

            return quotes[Math.floor(Math.random() * quotes.length)] as Quote;
        } catch {
            return null;
        }
    }

    async getRandomQuote(): Promise<Quote> {
        try {
            const count = (await this.db.countAsync({})) - 1;

            if (count > 0) {
                const skipCount = Math.floor(Math.random() * count);
                const quotes = await this.db.findAsync(
                    {
                        $where: function () {
                            return (this as Quote | QuoteAutoid)._id !== "__autoid__";
                        }
                    })
                    .skip(skipCount)
                    .limit(1)
                    .execAsync();

                return quotes[0] as Quote;
            }
        } catch {
            return null;
        }
    }

    async getAllQuotes(): Promise<Quote[]> {
        try {
            const quotes = await this.db.findAsync({
                $where: function () {
                    return (this as Quote | QuoteAutoid)._id !== "__autoid__";
                }
            });

            return quotes as Quote[];
        } catch {
            return null;
        }
    }

    private async updateQuoteId(quote: Quote, newId: number): Promise<boolean> {
        try {
            if (quote._id === newId) {
                return true;
            }

            await this.removeQuote(quote._id, true);

            quote._id = newId;
            await this.db.insertAsync(quote);

            this.events.emit("created-item", { quote });

            return true;
        } catch (error) {
            const err = error as Error;
            logger.error("QuoteDB: Error adding quote: ", err.message);
            return false;
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

        let idCounter = 1;
        for (const quote of quotes) {
            await this.updateQuoteId(quote, idCounter);
            idCounter++;
        }

        await this.setQuoteIdIncrementer(idCounter - 1);

        await this.db.compactDatafileAsync();

        frontendCommunicator.send("quotes-update");
    }

    async exportQuotesToFile(filepath: string): Promise<boolean> {
        try {
            const fileLines: string[] = [];
            const quotes = await this.db.findAsync({
                $where: function () {
                    return (this as Quote | QuoteAutoid)._id !== "__autoid__";
                }
            }) as Quote[];

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
            logger.error("Error exporting quotes to file", error);
        }

        return false;
    }
}

const manager = new QuoteManager();

export { manager as QuoteManager };