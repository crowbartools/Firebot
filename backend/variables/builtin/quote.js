// Migration: done

"use strict";
const quoteManager = require("../../quotes/quotes-manager");
const logger = require("../../logwrapper");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "quote",
        description: "Get a random quote",
        examples: [
            {
                usage: "quote[#]",
                description: "Get a specific quote id."
            }
        ],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, quoteId) => {
        let quote;
        quoteId = parseInt(quoteId);

        if (quoteId != null && !isNaN(quoteId)) {
            logger.debug("Getting quote " + quoteId + "...");
            quote = await quoteManager.getQuote(quoteId);
        } else {
            logger.debug("Getting random quote...");
            quote = await quoteManager.getRandomQuote();
        }

        if (quote != null) {
            let ts = new Date(quote.createdAt);
            let timestamp = ts.toLocaleString();
            let quoteText = decodeURIComponent(quote.text);
            let quoteString = quoteText + ' - ' + quote.originator + '. [' + quote.game + '] - ' + timestamp;
            logger.debug("Found a quote!");
            return quoteString;
        }

        logger.debug("Couldnt find a quote.");
        return '[Cant find quote]';
    }
};

module.exports = model;
