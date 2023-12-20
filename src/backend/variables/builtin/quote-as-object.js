// Migration: done

"use strict";
const quoteManager = require("../../quotes/quotes-manager");
const commandsManager = require("../../chat/commands/CommandManager");
const moment = require("moment");
const logger = require("../../logwrapper");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "quoteAsObject",
        description: "Get a random quote in the form of a JSON Object.",
        examples: [
            {
                usage: "quoteAsObject[#]",
                description: "Get a specific quote id."
            },
            {
                usage: "quoteAsObject[#, property]",
                description: "Get only a specific property for a specific quote. Valid properties are id, createdAt, creator, originator, text and game."
            },
            {
                usage: "quoteAsObject[null, property]",
                description: "Get only a specific property for a random quote. Valid properties are id, createdAt, creator, originator, text and game."
            }
        ],
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, quoteId, property) => {
        const quoteCommand = commandsManager.getSystemCommandById("firebot:quotesmanagement");
        const quoteDateFormat = quoteCommand.definition.options.quoteDateFormat.value;
        let quote;
        quoteId = parseInt(quoteId);

        if (quoteId != null && !isNaN(quoteId)) {
            logger.debug(`Getting quote ${quoteId}...`);
            quote = await quoteManager.getQuote(quoteId);
        } else {
            logger.debug("Getting random quote...");
            quote = await quoteManager.getRandomQuote();
        }

        if (quote != null) {
            logger.debug("Found a quote!");
            const quoteObject = {
                id: quote._id,
                createdAt: moment(quote.createdAt).format(quoteDateFormat),
                creator: quote.creator,
                originator: quote.originator,
                text: quote.text,
                game: quote.game
            };
            if (property != null) {
                if (property !== "id"
                    && property !== "createdAt"
                    && property !== "creator"
                    && property !== "originator"
                    && property !== "text"
                    && property !== "game") {
                    logger.debug("Failed property check for quote: ", property);
                    return "[Invalid Quote Property]";
                }
                return quoteObject[property];
            }

            return JSON.stringify(quoteObject);
        }

        logger.debug("Couldnt find a quote.");
        return '[Cant find quote]';
    }
};

module.exports = model;
