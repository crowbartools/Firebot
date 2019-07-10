"use strict";

/**
 * The Quotes Management
 */
const quotesManagement = {
    definition: {
        id: "firebot:quotesmanagement",
        name: "Quotes Management",
        active: true,
        trigger: "!quote",
        description: "Allows quote management via chat.",
        autoDeleteTrigger: true,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        },
        permission: {
            type: "none"
        },
        subCommands: [
            {
                arg: "add",
                usage: "add [@username] [quote]",
                description: "Adds a new quote.",
                permission: {
                    type: "group",
                    groups: ["Channel Editors", "Streamer", "Moderators"]
                }
            },
            {
                arg: "remove",
                usage: "remove [quoteIdNumber]",
                description: "Removes a quote using it's id number.",
                permission: {
                    type: "group",
                    groups: ["Channel Editors", "Streamer", "Moderators"]
                }
            }
        ]
    },
    /**
   * When the command is triggered
   */
    onTriggerEvent: event => {
        return new Promise(async (resolve) => {
            const quotesManager = require("../../../quotes/quotes-manager");
            const logger = require("../../../logwrapper");
            const Chat = require("../../../common/mixer-chat");
            const moment = require("moment");

            let args = event.userCommand.args;

            const getFormattedQuoteString = (quote) => {
                let prettyDate = moment(quote.createdAt).format("MM/DD/YYYY");
                return `Quote #${quote.id}: "${quote.text}" - @${quote.originator} [${quote.game}] [${prettyDate}]`;
            };

            if (args.length === 0) {
                // no args, only "!quote" was issued
                const quote = await quotesManager.getRandomQuote();

                if (quote) {
                    let formattedQuote = getFormattedQuoteString(quote);
                    Chat.smartSend(formattedQuote);
                    logger.debug('We pulled a quote by id: ' + formattedQuote);
                } else {
                    Chat.smartSend(`Could not find a random quote!`);
                }
                return resolve();
            }

            let triggeredArg = args[0];

            switch (triggeredArg) {
            case "add": {
                if (args.length < 3) {
                    Chat.smartSend(`Please provide some quote text!`, event.userCommand.commandSender);
                    return resolve();
                }
                let newQuote = {
                    text: args.slice(2, args.length).join(" "),
                    originator: args[1].replace("@", ""),
                    creator: event.userCommand.commandSender,
                    game: "Unknown Game",
                    createdAt: moment().toISOString()
                };
                let newQuoteId = await quotesManager.addQuote(newQuote);
                Chat.smartSend(
                    `Added Quote #${newQuoteId}!`
                );
                logger.debug(`Quote #${newQuoteId} added!`);
                return resolve();
            }
            case "remove": {
                let quoteId = parseInt(args[1]);
                if (!isNaN(quoteId)) {
                    await quotesManager.removeQuote(quoteId);
                    Chat.smartSend(`Quote ${quoteId} was removed.`);
                    logger.debug('A quote was removed here.');
                    return resolve();
                }

                Chat.smartSend(
                    `Sorry! Couldnt find a quote with that id number.`,
                    event.userCommand.commandSender
                );
                logger.error('Quotes: NaN passed to remove quote command.');
                return resolve();
            }
            default: {
                let quoteId = parseInt(triggeredArg);
                if (!isNaN(quoteId)) {
                    // Most likely a quote id, so go get the quote.
                    const quote = await quotesManager.getQuote(quoteId);
                    if (quote) {
                        let formattedQuote = getFormattedQuoteString(quote);
                        Chat.smartSend(formattedQuote);
                        logger.debug('We pulled a quote using an id: ' + formattedQuote);
                    } else {
                        // If we get here, it's likely the command was used wrong. Tell the sender they done fucked up
                        Chat.smartSend(
                            `Sorry! We couldnt find a quote with that id. Please use a numbered id.`,
                            event.userCommand.commandSender
                        );
                    }
                    return resolve();
                }

                // Try getting a quote using word search.
                const quote = await quotesManagement.getRandomQuoteByWord(triggeredArg);
                if (quote) {
                    let formattedQuote = getFormattedQuoteString(quote);
                    Chat.smartSend(
                        formattedQuote
                    );
                    logger.debug('We pulled a quote using words: ' + formattedQuote);
                    return resolve();
                }

                logger.debug('Some bad stuff happened with quotes.');
            }
            }

            resolve();
        });
    }
};

module.exports = quotesManagement;
