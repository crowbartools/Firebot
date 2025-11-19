import fsp from "fs/promises";

import type { ThirdPartyImporter } from "../../../types/import";
import type { Quote } from "../../../types/quotes";

import { QuoteManager } from "../../quotes/quote-manager";

import logger from "../../logwrapper";


export const FirebotImporter: ThirdPartyImporter = {
    id: "firebot",
    appName: "Firebot",
    filetypes: [
        { name: "CSV File", extensions: ["csv"] }
    ],
    loadQuotes: async (filepath) => {
        try {
            const fileLines = (await fsp.readFile(filepath, { encoding: "utf8" }))
                .split(/\r?\n/);

            const headers = [
                "ID",
                "Text",
                "Originator",
                "Creator",
                "Category",
                "Created"
            ];
            // Validate header
            const header = fileLines.shift();
            if (header !== headers.join(",")) {
                return {
                    success: false,
                    error: "Invalid file format"
                };
            }

            const existingQuotes = await QuoteManager.getAllQuotes();

            const quotes: Quote[] = [];
            fileLines.forEach((line) => {
                // First we need the text of the quote, because the text can contain commas.
                const splittedQuote = line.split('"');

                const id = splittedQuote.shift().split(",")[0];
                const metadata = splittedQuote.pop().split(",");
                const text = splittedQuote.join("");

                if (existingQuotes.some(q => q.text.split('"').join("") === text)) {
                    return;
                }

                // We're getting the comma off first, then get the rest.
                // Game comes last, since a game/category can contain commas.
                metadata.shift();
                const originator = metadata.shift();
                const creator = metadata.shift();
                const createdAt = metadata.pop();
                const game = metadata.join(",");

                quotes.push({
                    _id: Number(id),
                    text: text,
                    originator: originator,
                    creator: creator,
                    game: game,
                    createdAt: createdAt
                });
            });

            return {
                success: true,
                data: {
                    quotes
                }
            };
        } catch (error) {
            logger.error(`Unexpected error while parsing Firebot quotes`, error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }
};