"use strict";

const app = require('electron').app;

const moment = require("moment");
moment.locale(app.getLocale());

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
        baseCommandDescription: "Display a random quote",
        options: {
            quoteDisplayTemplate: {
                type: "string",
                title: "Quote Display Template",
                description: "How quotes are displayed in chat.",
                tip: "Variables: {id}, {text}, {author}, {game}, {date}",
                default: `Quote {id}: "{text}" - @{author} [{game}] [{date}]`,
                useTextArea: true
            }
        },
        subCommands: [
            {
                id: "quotelookup",
                arg: "\\d+",
                regex: true,
                usage: "[quoteId]",
                description: "Displays the quote with the given ID."
            },
            {
                arg: "add",
                usage: "add [@username] [quoteText]",
                description: "Adds a new quote.",
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "Mod",
                                "ChannelEditor",
                                "Owner"
                            ]
                        }
                    ]
                }
            },
            {
                arg: "remove",
                usage: "remove [quoteId]",
                description: "Removes a quote using it's id.",
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "Mod",
                                "ChannelEditor",
                                "Owner"
                            ]
                        }
                    ]
                }
            },
            {
                arg: "edittext",
                usage: "edittext [quoteId] [newText]",
                description: "Edit the text given quote.",
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "Mod",
                                "ChannelEditor",
                                "Owner"
                            ]
                        }
                    ]
                }
            },
            {
                arg: "edituser",
                usage: "edituser [quoteId] [newUsername]",
                description: "Edit the user of the given quote.",
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "Mod",
                                "ChannelEditor",
                                "Owner"
                            ]
                        }
                    ]
                }
            },
            {
                arg: "list",
                usage: "list",
                description: "Gives a link that lists out all quotes."
            },
            {
                arg: "search",
                usage: "search [searchTerm]",
                description: "Gives a random quote using the search term."
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
            const chat = require("../../chat");
            const api = require("../../../mixer-api/api");

            let { commandOptions } = event;

            let args = event.userCommand.args;

            const getFormattedQuoteString = (quote) => {
                let prettyDate = moment(quote.createdAt).format('L');
                return commandOptions.quoteDisplayTemplate
                    .replace("{id}", quote._id)
                    .replace("{text}", quote.text)
                    .replace("{author}", quote.originator)
                    .replace("{game}", quote.game)
                    .replace("{date}", prettyDate);
            };

            if (args.length === 0) {
                // no args, only "!quote" was issued
                const quote = await quotesManager.getRandomQuote();

                if (quote) {
                    let formattedQuote = getFormattedQuoteString(quote);
                    chat.sendChatMessage(formattedQuote);
                    logger.debug('We pulled a quote by id: ' + formattedQuote);
                } else {
                    chat.sendChatMessage(`Could not find a random quote!`);
                }
                return resolve();
            }

            let triggeredArg = args[0];

            if (event.userCommand.subcommandId === "quotelookup") {
                let quoteId = parseInt(triggeredArg);
                const quote = await quotesManager.getQuote(quoteId);
                if (quote) {
                    let formattedQuote = getFormattedQuoteString(quote);
                    chat.sendChatMessage(formattedQuote);
                    logger.debug('We pulled a quote using an id: ' + formattedQuote);
                } else {
                    // If we get here, it's likely the command was used wrong. Tell the sender they done fucked up
                    chat.sendChatMessage(
                        `Sorry! We couldnt find a quote with that id.`,
                        event.userCommand.commandSender
                    );
                }
                return resolve();
            }

            switch (triggeredArg) {
            case "add": {
                if (args.length < 3) {
                    chat.sendChatMessage(`Please provide some quote text!`, event.userCommand.commandSender);
                    return resolve();
                }

                // Get stream info so we can get the game name.
                let streamerChannelData = await api.channels.getStreamersChannel();

                let currentGameName = streamerChannelData.type && streamerChannelData.type.name ?
                    streamerChannelData.type.name : "Unknown game";

                let newQuote = {
                    text: args.slice(2, args.length).join(" "),
                    originator: args[1].replace(/@/g, ""),
                    creator: event.userCommand.commandSender,
                    game: currentGameName,
                    createdAt: moment().toISOString()
                };
                let newQuoteId = await quotesManager.addQuote(newQuote);
                let newQuoteText = await quotesManager.getQuote(newQuoteId);
                let formattedQuote = getFormattedQuoteString(newQuoteText);
                chat.sendChatMessage(
                    `Added ${formattedQuote}`
                );
                logger.debug(`Quote #${newQuoteId} added!`);
                return resolve();
            }
            case "remove": {
                let quoteId = parseInt(args[1]);
                if (!isNaN(quoteId)) {
                    await quotesManager.removeQuote(quoteId);
                    chat.sendChatMessage(`Quote ${quoteId} was removed.`);
                    logger.debug('A quote was removed: ' + quoteId);
                    return resolve();
                }

                chat.sendChatMessage(
                    `Sorry! Couldnt find a quote with that id number.`,
                    event.userCommand.commandSender
                );
                logger.error('Quotes: NaN passed to remove quote command.');
                return resolve();
            }
            case "list": {
                const cloudSync = require('../../../cloud-sync/profile-sync');

                let profileJSON = {
                    'username': event.chatEvent.user_name,
                    'userRoles': event.chatEvent.user_roles,
                    'profilePage': 'quotes'
                };

                let binId = await cloudSync.syncProfileData(profileJSON);

                if (binId == null) {
                    chat.sendChatMessage(
                        "There are no quotes to pull!",
                        event.userCommand.commandSender
                    );
                } else {
                    chat.sendChatMessage(
                        `Here a list of quotes! https://crowbartools.com/tools/firebot/profile?id=${binId}`,
                        event.userCommand.commandSender
                    );
                }

                return resolve();
            }
            case "search": {

                // strip first token("search") from input, and join the remaining using space as the delimiter
                const searchTerm = args.slice(1).join(" ");

                // attempt to get a random quote containing the text as an exact match
                const quote = await quotesManager.getRandomQuoteContainingText(searchTerm);

                // quote found
                if (quote != null) {

                    // format quote
                    let formattedQuote = getFormattedQuoteString(quote);

                    // send to chat
                    chat.sendChatMessage(formattedQuote);

                    // log (Maybe move this to the manager?)
                    logger.debug('We pulled a quote using an id: ' + formattedQuote);

                // no matching quote found
                } else {

                    chat.sendChatMessage(
                        `Sorry! We couldnt find a quote using those terms.`,
                        event.userCommand.commandSender
                    );
                }

                // resolve promise
                return resolve();
            }
            case "edittext": {
                if (args.length < 3) {
                    chat.sendChatMessage(
                        `Invalid usage! ${event.userCommand.trigger} edittext [quoteId] [newText]`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let quoteId = parseInt(args[1]);
                if (isNaN(quoteId)) {
                    chat.sendChatMessage(
                        `Invalid Quote Id!`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                const quote = await quotesManager.getQuote(quoteId);

                if (quote == null) {
                    chat.sendChatMessage(
                        `Cannot find quote with id ${quoteId}`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                const newText = args.slice(2).join(" ");
                quote.text = newText;

                try {
                    await quotesManager.updateQuote(quote);
                } catch (err) {
                    chat.sendChatMessage(
                        `Failed to update quote ${quoteId}!`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let formattedQuote = getFormattedQuoteString(quote);
                chat.sendChatMessage(
                    `Edited ${formattedQuote}`
                );

                // resolve promise
                return resolve();
            }
            case "edituser": {
                if (args.length < 3) {
                    chat.sendChatMessage(
                        `Invalid usage! ${event.userCommand.trigger} edituser [quoteId] [newUsername]`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let quoteId = parseInt(args[1]);
                if (isNaN(quoteId)) {
                    chat.sendChatMessage(
                        `Invalid Quote Id!`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                const quote = await quotesManager.getQuote(quoteId);

                if (quote == null) {
                    chat.sendChatMessage(
                        `Cannot find quote with id ${quoteId}`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                const newUser = args[2].replace(/@/g, "");
                quote.originator = newUser;

                try {
                    await quotesManager.updateQuote(quote);
                } catch (err) {
                    chat.sendChatMessage(
                        `Failed to update quote ${quoteId}!`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let formattedQuote = getFormattedQuoteString(quote);
                chat.sendChatMessage(
                    `Edited ${formattedQuote}`
                );

                // resolve promise
                return resolve();
            }
            default: {

                // Try getting a quote using word search.
                const quote = await quotesManagement.getRandomQuoteByWord(triggeredArg);
                if (quote) {
                    let formattedQuote = getFormattedQuoteString(quote);
                    chat.sendChatMessage(
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
