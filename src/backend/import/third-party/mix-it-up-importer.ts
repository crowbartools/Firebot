import fsp from "fs/promises";

import type { ThirdPartyImporter } from "../../../types/import";
import type { Quote } from "../../../types/quotes";

import logger from "../../logwrapper";

export const MixItUpImporter: ThirdPartyImporter = {
    id: "mixitup",
    appName: "Mix It Up",
    filetypes: [
        { name: "Text Files", extensions: ["txt"] }
    ],
    loadQuotes: async (filepath) => {
        try {
            const fileLines = (await fsp.readFile(filepath, { encoding: "utf8" }))
                .split(/\r?\n/);

            const headers = [
                "#",
                "Quote",
                "Game",
                "Date/Time"
            ];

            // Validate header
            const header = fileLines.shift();
            if (header !== headers.join("\t")) {
                return {
                    success: false,
                    error: "Invalid file format"
                };
            }

            const quotes: Quote[] = [];
            fileLines.forEach((line) => {
                if (line.trim() !== "") {
                    const splittedQuote = line.split("\t");
                    quotes.push({
                        _id: Number(splittedQuote[0]),
                        text: splittedQuote[1],
                        originator: "",
                        creator: "",
                        game: splittedQuote[2],
                        createdAt: splittedQuote[3]
                    });
                }
            });

            return {
                success: true,
                data: {
                    quotes
                }
            };
        } catch (error) {
            logger.error(`Unexpected error while parsing Mix It Up quotes`, error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    },
    loadViewers: async (filepath) => {
        const fileLines = (await fsp.readFile(filepath, { encoding: "utf8" }))
            .split(/\r?\n/);

        const headers = [
            "MixItUpID",
            "TwitchID",
            "TwitchUsername",
            "YouTubeID",
            "YouTubeUsername",
            "TrovoID",
            "TrovoUsername",
            "Minutes",
            "CustomTitle",
            "TotalStreamsWatched",
            "TotalAmountDonated",
            "TotalSubsGifted",
            "TotalSubsReceived",
            "TotalChatMessagesSent",
            "TotalTimesTagged",
            "TotalCommandsRun",
            "TotalMonthsSubbed",
            "LastSeen"
        ];

        // Validate header
        const header = fileLines.shift();
        if (header !== headers.join("\t")) {
            return {
                success: false,
                error: "Invalid file format"
            };
        }

        return {
            success: false,
            error: "Not implemented"
        };
    }
};