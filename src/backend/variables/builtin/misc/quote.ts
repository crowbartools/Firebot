import moment from "moment";

import type { ReplaceVariable } from "../../../../types/variables";
import type { Quote } from "../../../../types/quotes";

import { CommandManager } from "../../../chat/commands/command-manager";
import { QuoteManager } from "../../../quotes/quote-manager";
import logger from "../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "quote",
        description: "Get a random quote",
        examples: [
            {
                usage: "quote[#]",
                description: "Get a specific quote id."
            }
        ],
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (_, quoteId: number) => {
        const quoteCommand = CommandManager.getSystemCommandById("firebot:quotesmanagement");
        const quoteDateFormat = quoteCommand.definition.options.quoteDateFormat.value as string;
        let quote: Quote;
        quoteId = parseInt(`${quoteId}`);

        if (quoteId != null && !isNaN(quoteId)) {
            logger.debug(`Getting quote ${quoteId}...`);
            quote = await QuoteManager.getQuote(quoteId);
        } else {
            logger.debug("Getting random quote...");
            quote = await QuoteManager.getRandomQuote();
        }

        if (quote != null) {
            const date = moment(quote.createdAt).format(quoteDateFormat);
            const quoteText = decodeURIComponent(quote.text);
            const quoteString = `${quoteText} - ${quote.originator}. [${quote.game}] - ${date}`;
            logger.debug("Found a quote!");
            return quoteString;
        }

        logger.debug(`Couldn't find a quote.`);
        return '[Cant find quote]';
    }
};

export default model;