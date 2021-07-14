"use strict";

const app = require('electron').app;

const moment = require("moment");
moment.locale(app.getLocale());

const quotesManagement = {
    definition: {
        id: "firebot:quotesmanagement",
        name: "Quotes Management",
        active: true,
        trigger: "!quote",
        description: "Allows quote management via chat.",
        autoDeleteTrigger: false,
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
            },
            quoteDateFormat: {
                type: "enum",
                title: "Quote Date Format",
                description: "How dates should be formatted for the 'editdate' mod command.",
                options: [
                    "MM/DD/YYYY",
                    "DD/MM/YYYY"
                ],
                default: "MM/DD/YYYY"
            },
            useTTS: {
                type: "boolean",
                title: "Read Quotes via TTS",
                description: "Have quotes read by TTS whenever one is created or looked up.",
                default: false
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
                                "mod",
                                "broadcaster"
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
                                "mod",
                                "broadcaster"
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
                                "mod",
                                "broadcaster"
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
                                "mod",
                                "broadcaster"
                            ]
                        }
                    ]
                }
            },
            {
                arg: "editgame",
                usage: "editgame [quoteId] [newGame]",
                minArgs: 3,
                description: "Edit the game of the given quote.",
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "mod",
                                "broadcaster"
                            ]
                        }
                    ]
                }
            },
            {
                arg: "editdate",
                usage: "editdate [quoteId] [newDate]",
                minArgs: 3,
                description: "Edit the date of the given quote.",
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "mod",
                                "broadcaster"
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
                minArgs: 2,
                description: "Gives a random quote using the search term(s)."
            },
            {
                arg: "searchuser",
                usage: "searchuser @username",
                minArgs: 2,
                description: "Gives a random quote said by the given user."
            },
            {
                arg: "searchdate",
                usage: "searchdate DD MM YYYY",
                minArgs: 3,
                description: "Gives a random quote at the given date."
            },
            {
                arg: "searchgame",
                usage: "searchgame [searchTerm]",
                minArgs: 2,
                description: "Gives a random quote at the given game."
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
            const twitchChat = require("../../twitch-chat");
            const twitchChannels = require("../../../twitch-api/resource/channels");
            const frontendCommunicator = require("../../../common/frontend-communicator");

            let { commandOptions } = event;

            let args = event.userCommand.args;

            const getFormattedQuoteString = (quote) => {
                let prettyDate = quote.createdAt != null ? moment(quote.createdAt).format('L') : "No Date";
                return commandOptions.quoteDisplayTemplate
                    .replace("{id}", quote._id)
                    .replace("{text}", quote.text)
                    .replace("{author}", quote.originator)
                    .replace("{game}", quote.game)
                    .replace("{date}", prettyDate);
            };

            const sendToTTS = (quote) => {
                if (commandOptions.useTTS) {
                    //Send to TTS
                    frontendCommunicator.send("read-tts", {
                        text: quote
                    });
                }
            };

            if (args.length === 0) {
                // no args, only "!quote" was issued
                const quote = await quotesManager.getRandomQuote();

                if (quote) {
                    let formattedQuote = getFormattedQuoteString(quote);
                    twitchChat.sendChatMessage(formattedQuote);
                    sendToTTS(formattedQuote);

                    logger.debug('We pulled a quote by id: ' + formattedQuote);
                } else {
                    twitchChat.sendChatMessage(`Could not find a random quote!`);
                }
                return resolve();
            }

            let triggeredArg = args[0];

            if (event.userCommand.subcommandId === "quotelookup") {
                let quoteId = parseInt(triggeredArg);
                const quote = await quotesManager.getQuote(quoteId);
                if (quote) {
                    let formattedQuote = getFormattedQuoteString(quote);
                    twitchChat.sendChatMessage(formattedQuote);
                    sendToTTS(formattedQuote);
                    logger.debug('We pulled a quote using an id: ' + formattedQuote);
                } else {
                    // If we get here, it's likely the command was used wrong. Tell the sender they done fucked up
                    twitchChat.sendChatMessage(`Sorry! We couldn't find a quote with that id.`);
                }
                return resolve();
            }

            switch (triggeredArg) {
            case "add": {
                if (args.length < 3) {
                    twitchChat.sendChatMessage(`Please provide some quote text!`);
                    return resolve();
                }

                const channelData = await twitchChannels.getChannelInformation();

                let currentGameName = channelData && channelData.game_name ? channelData.game_name : "Unknown game";

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
                twitchChat.sendChatMessage(
                    `Added ${formattedQuote}`
                );
                sendToTTS(formattedQuote);
                logger.debug(`Quote #${newQuoteId} added!`);
                return resolve();
            }
            case "remove": {
                let quoteId = parseInt(args[1]);
                if (!isNaN(quoteId)) {
                    await quotesManager.removeQuote(quoteId);
                    twitchChat.sendChatMessage(`Quote ${quoteId} was removed.`);
                    logger.debug('A quote was removed: ' + quoteId);
                    return resolve();
                }

                twitchChat.sendChatMessage(`Sorry! Couldnt find a quote with that id number.`);
                logger.error('Quotes: NaN passed to remove quote command.');
                return resolve();
            }
            case "list": {
                const cloudSync = require('../../../cloud-sync/profile-sync');

                let profileJSON = {
                    username: event.chatMessage.username,
                    userRoles: event.chatMessage.roles,
                    profilePage: 'quotes'
                };

                let binId = await cloudSync.syncProfileData(profileJSON);

                if (binId == null) {
                    twitchChat.sendChatMessage("There are no quotes to pull!");
                } else {
                    twitchChat.sendChatMessage(`Here a list of quotes! https://firebot.app/profile?id=${binId}`);
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
                    twitchChat.sendChatMessage(formattedQuote);
                    sendToTTS(formattedQuote);

                    // log (Maybe move this to the manager?)
                    logger.debug('We pulled a quote using an id: ' + formattedQuote);

                // no matching quote found
                } else {

                    twitchChat.sendChatMessage(`Sorry! We couldnt find a quote using those terms.`);
                }

                // resolve promise
                return resolve();
            }
            case "searchuser": {
                const username = args[1].replace("@", "");

                const quote = await quotesManager.getRandomQuoteByAuthor(username);

                if (quote != null) {

                    const formattedQuote = getFormattedQuoteString(quote);
                    sendToTTS(formattedQuote);
                    twitchChat.sendChatMessage(formattedQuote);
                } else {
                    twitchChat.sendChatMessage(`Sorry! We couldn't find a quote by ${username}`);
                }
                return resolve();
            }
            case "searchgame": {
                const searchTerm = args.slice(1).join(" ");
                const quote = await quotesManager.getRandomQuoteByGame(searchTerm);
                if (quote != null) {
                    const formattedQuote = getFormattedQuoteString(quote);
                    twitchChat.sendChatMessage(formattedQuote);
                    sendToTTS(formattedQuote);
                } else {
                    twitchChat.sendChatMessage(`Sorry! We couldn't find a quote with game ${searchTerm}`);
                }
                return resolve();
            }
            case "searchdate": {
                const day = !isNaN(args[1]) ? parseInt(args[1]) : null;
                const month = !isNaN(args[2]) ? parseInt(args[2]) : null;
                const year = !isNaN(args[3]) ? parseInt(args[3]) : null;

                if (day == null || month == null || day > 31 || day < 1 ||
                    month > 12 || month < 1) {
                    twitchChat.sendChatMessage(`Invalid quote date search!`);
                    return resolve();
                }

                const quote = await quotesManager.getRandomQuoteByDate({
                    day,
                    month,
                    year
                });

                if (quote != null) {
                    const formattedQuote = getFormattedQuoteString(quote);
                    twitchChat.sendChatMessage(formattedQuote);
                    sendToTTS(formattedQuote);
                } else {
                    twitchChat.sendChatMessage(`Sorry! We couldn't find a quote with date ${day}/${month}/${year || "*"}`);
                }
                return resolve();
            }
            case "edittext": {
                if (args.length < 3) {
                    twitchChat.sendChatMessage(`Invalid usage! ${event.userCommand.trigger} edittext [quoteId] [newText]`);
                    return resolve();
                }

                let quoteId = parseInt(args[1]);
                if (isNaN(quoteId)) {
                    twitchChat.sendChatMessage(`Invalid Quote Id!`);
                    return resolve();
                }

                const quote = await quotesManager.getQuote(quoteId);

                if (quote == null) {
                    twitchChat.sendChatMessage(`Cannot find quote with id ${quoteId}`);
                    return resolve();
                }

                const newText = args.slice(2).join(" ");
                quote.text = newText;

                try {
                    await quotesManager.updateQuote(quote);
                } catch (err) {
                    twitchChat.sendChatMessage(`Failed to update quote ${quoteId}!`);
                    return resolve();
                }

                let formattedQuote = getFormattedQuoteString(quote);

                twitchChat.sendChatMessage(
                    `Edited ${formattedQuote}`
                );

                // resolve promise
                return resolve();
            }
            case "editgame": {
                if (args.length < 3) {
                    twitchChat.sendChatMessage(`Invalid usage! ${event.userCommand.trigger} editgame [quoteId] [newGame]`);
                    return resolve();
                }

                let quoteId = parseInt(args[1]);
                if (isNaN(quoteId)) {
                    twitchChat.sendChatMessage(`Invalid Quote Id!`);
                    return resolve();
                }

                const quote = await quotesManager.getQuote(quoteId);

                if (quote == null) {
                    twitchChat.sendChatMessage(`Cannot find quote with id ${quoteId}`);
                    return resolve();
                }

                const newGameName = args.slice(2).join(" ");
                quote.game = newGameName;

                try {
                    await quotesManager.updateQuote(quote);
                } catch (err) {
                    twitchChat.sendChatMessage(`Failed to update quote ${quoteId}!`);
                    return resolve();
                }

                let formattedQuote = getFormattedQuoteString(quote);
                twitchChat.sendChatMessage(
                    `Edited ${formattedQuote}`
                );

                // resolve promise
                return resolve();
            }
            case "editdate": {

                const dateFormat = commandOptions.quoteDateFormat;

                if (args.length < 3) {
                    twitchChat.sendChatMessage(`Invalid usage! ${event.userCommand.trigger} editdate [quoteId] ${dateFormat}`);
                    return resolve();
                }

                let quoteId = parseInt(args[1]);
                if (isNaN(quoteId)) {
                    twitchChat.sendChatMessage(`Invalid Quote Id!`);
                    return resolve();
                }

                const quote = await quotesManager.getQuote(quoteId);

                if (quote == null) {
                    twitchChat.sendChatMessage(`Cannot find quote with id ${quoteId}`);
                    return resolve();
                }

                const newDate = args.slice(2).join(" ");

                const date = moment(newDate, dateFormat);
                if (!date.isValid()) {
                    twitchChat.sendChatMessage(`Invalid date format!`);
                    return resolve();
                }

                quote.createdAt = date.toISOString();

                try {
                    await quotesManager.updateQuote(quote);
                } catch (err) {
                    twitchChat.sendChatMessage(`Failed to update quote ${quoteId}!`);
                    return resolve();
                }

                let formattedQuote = getFormattedQuoteString(quote);
                twitchChat.sendChatMessage(
                    `Edited ${formattedQuote}`
                );

                // resolve promise
                return resolve();
            }
            case "edituser": {
                if (args.length < 3) {
                    twitchChat.sendChatMessage(
                        `Invalid usage! ${event.userCommand.trigger} edituser [quoteId] [newUsername]`);
                    return resolve();
                }

                let quoteId = parseInt(args[1]);
                if (isNaN(quoteId)) {
                    twitchChat.sendChatMessage(
                        `Invalid Quote Id!`);
                    return resolve();
                }

                const quote = await quotesManager.getQuote(quoteId);

                if (quote == null) {
                    twitchChat.sendChatMessage(
                        `Cannot find quote with id ${quoteId}`);
                    return resolve();
                }

                const newUser = args[2].replace(/@/g, "");
                quote.originator = newUser;

                try {
                    await quotesManager.updateQuote(quote);
                } catch (err) {
                    twitchChat.sendChatMessage(
                        `Failed to update quote ${quoteId}!`);
                    return resolve();
                }

                let formattedQuote = getFormattedQuoteString(quote);
                twitchChat.sendChatMessage(
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
                    twitchChat.sendChatMessage(
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
