import { app } from "electron";
import moment from "moment";

import { SystemCommand } from "../../../../types/commands";

moment.locale(app.getLocale());

/**
 * The `!quote` command
 */
export const QuotesManagementSystemCommand: SystemCommand<{
    quoteDisplayTemplate: string;
    quoteDateFormat: string;
    useTTS: boolean;
    defaultStreamerAttribution: boolean;
}> = {
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
                description: "How dates should be formatted for the '!quote' and '!quote editdate' commands.",
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
            },
            defaultStreamerAttribution: {
                type: "boolean",
                title: "Attribute new quote to streamer if nobody is explicitly tagged with @",
                description: "If @username is not included when adding a quote, it is attributed to the streamer.",
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
                description: "Removes a quote using its id.",
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
    onTriggerEvent: (event) => {
        return new Promise<void>(async (resolve) => {
            const quotesManager = require("../../../quotes/quotes-manager");
            const logger = require("../../../logwrapper");
            const twitchChat = require("../../twitch-chat");
            const TwitchApi = require("../../../twitch-api/api");
            const frontendCommunicator = require("../../../common/frontend-communicator");

            const { commandOptions } = event;

            const args = event.userCommand.args;

            const getFormattedQuoteString = (quote) => {
                const prettyDate = quote.createdAt != null ? moment(quote.createdAt).format(commandOptions.quoteDateFormat) : "No Date";
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
                    const formattedQuote = getFormattedQuoteString(quote);
                    await twitchChat.sendChatMessage(formattedQuote);
                    sendToTTS(formattedQuote);

                    logger.debug(`We pulled a quote by id: ${formattedQuote}`);
                } else {
                    await twitchChat.sendChatMessage(`Could not find a random quote!`);
                }
                return resolve();
            }

            const triggeredArg = args[0];

            if (event.userCommand.subcommandId === "quotelookup") {
                const quoteId = parseInt(triggeredArg);
                const quote = await quotesManager.getQuote(quoteId);
                if (quote) {
                    const formattedQuote = getFormattedQuoteString(quote);
                    await twitchChat.sendChatMessage(formattedQuote);
                    sendToTTS(formattedQuote);
                    logger.debug(`We pulled a quote using an id: ${formattedQuote}`);
                } else {
                    // If we get here, it's likely the command was used wrong. Tell the sender they done fucked up
                    await twitchChat.sendChatMessage(`Sorry! We could not find a quote with that id.`);
                }
                return resolve();
            }

            switch (triggeredArg) {
                case "add": {
                    const shouldInsertStreamerUsername =
                        (commandOptions.defaultStreamerAttribution && args.length === 1) ||
                        (commandOptions.defaultStreamerAttribution && !args[1].includes("@"));
                    const expectedArgs = shouldInsertStreamerUsername
                        ? 2
                        : 3;

                    if (args.length < expectedArgs) {
                        await twitchChat.sendChatMessage(`Please provide some quote text!`);
                        return resolve();
                    }
                    // Once we've evaluated that the syntax is correct we make our API calls
                    const channelData = await TwitchApi.channels.getChannelInformation();
                    const currentGameName = channelData && channelData.gameName ? channelData.gameName : "Unknown game";

                    // If shouldInsertStreamerUsername and no @ is included in the originator arg, set originator @streamerName and treat the rest as the quote
                    if (shouldInsertStreamerUsername) {
                        args.splice(1, 0, `@${channelData.displayName}`);
                    }

                    const newQuote = {
                        text: args.slice(2, args.length).join(" "),
                        originator: args[1].replace(/@/g, ""),
                        creator: event.userCommand.commandSender,
                        game: currentGameName,
                        createdAt: moment().toISOString()
                    };
                    const newQuoteId = await quotesManager.addQuote(newQuote);
                    const newQuoteText = await quotesManager.getQuote(newQuoteId);
                    const formattedQuote = getFormattedQuoteString(newQuoteText);
                    await twitchChat.sendChatMessage(
                        `Added ${formattedQuote}`
                    );
                    sendToTTS(formattedQuote);
                    logger.debug(`Quote #${newQuoteId} added!`);
                    return resolve();
                }
                case "remove": {
                    const quoteId = parseInt(args[1]);
                    if (!isNaN(quoteId)) {
                        await quotesManager.removeQuote(quoteId);
                        await twitchChat.sendChatMessage(`Quote ${quoteId} was removed.`);
                        logger.debug(`A quote was removed: ${quoteId}`);
                        return resolve();
                    }

                    await twitchChat.sendChatMessage(`Sorry! We could not find a quote with that id.`);
                    logger.error('Quotes: NaN passed to remove quote command.');
                    return resolve();
                }
                case "list": {
                    const cloudSync = require('../../../cloud-sync/profile-sync');

                    const profileJSON = {
                        username: event.chatMessage.username,
                        userRoles: event.chatMessage.roles,
                        profilePage: 'quotes'
                    };

                    const binId = await cloudSync.syncProfileData(profileJSON);

                    if (binId == null) {
                        await twitchChat.sendChatMessage("There are no quotes to pull!");
                    } else {
                        await twitchChat.sendChatMessage(`Here is a list of quotes! https://firebot.app/profile?id=${binId}`);
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
                        const formattedQuote = getFormattedQuoteString(quote);

                        // send to chat
                        await twitchChat.sendChatMessage(formattedQuote);
                        sendToTTS(formattedQuote);

                        // log (Maybe move this to the manager?)
                        logger.debug(`We pulled a quote using an id: ${formattedQuote}`);

                        // no matching quote found
                    } else {

                        await twitchChat.sendChatMessage(`Sorry! We could not find a quote using those terms.`);
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
                        await twitchChat.sendChatMessage(formattedQuote);
                    } else {
                        await twitchChat.sendChatMessage(`Sorry! We could not find a quote by ${username}`);
                    }
                    return resolve();
                }
                case "searchgame": {
                    const searchTerm = args.slice(1).join(" ");
                    const quote = await quotesManager.getRandomQuoteByGame(searchTerm);
                    if (quote != null) {
                        const formattedQuote = getFormattedQuoteString(quote);
                        await twitchChat.sendChatMessage(formattedQuote);
                        sendToTTS(formattedQuote);
                    } else {
                        await twitchChat.sendChatMessage(`Sorry! We could not find a quote with game ${searchTerm}`);
                    }
                    return resolve();
                }
                case "searchdate": {
                    const rawDay = parseInt(args[1]);
                    const rawMonth = parseInt(args[2]);
                    const rawYear = parseInt(args[3]);

                    const day = !isNaN(rawDay) ? rawDay : null;
                    const month = !isNaN(rawMonth) ? rawMonth : null;
                    const year = !isNaN(rawYear) ? rawYear : null;

                    if (day == null || month == null || day > 31 || day < 1 ||
                    month > 12 || month < 1) {
                        await twitchChat.sendChatMessage(`Invalid quote date search!`);
                        return resolve();
                    }

                    const quote = await quotesManager.getRandomQuoteByDate({
                        day,
                        month,
                        year
                    });

                    if (quote != null) {
                        const formattedQuote = getFormattedQuoteString(quote);
                        await twitchChat.sendChatMessage(formattedQuote);
                        sendToTTS(formattedQuote);
                    } else {
                        await twitchChat.sendChatMessage(`Sorry! We could not find a quote with date ${day}/${month}/${year || "*"}`);
                    }
                    return resolve();
                }
                case "edittext": {
                    if (args.length < 3) {
                        await twitchChat.sendChatMessage(`Invalid usage! ${event.userCommand.trigger} edittext [quoteId] [newText]`);
                        return resolve();
                    }

                    const quoteId = parseInt(args[1]);
                    if (isNaN(quoteId)) {
                        await twitchChat.sendChatMessage(`Invalid Quote Id!`);
                        return resolve();
                    }

                    const quote = await quotesManager.getQuote(quoteId);

                    if (quote == null) {
                        await twitchChat.sendChatMessage(`Could not find a quote with id ${quoteId}`);
                        return resolve();
                    }

                    const newText = args.slice(2).join(" ");
                    quote.text = newText;

                    try {
                        await quotesManager.updateQuote(quote);
                    } catch (err) {
                        await twitchChat.sendChatMessage(`Failed to update quote ${quoteId}!`);
                        return resolve();
                    }

                    const formattedQuote = getFormattedQuoteString(quote);

                    await twitchChat.sendChatMessage(
                        `Edited ${formattedQuote}`
                    );

                    // resolve promise
                    return resolve();
                }
                case "editgame": {
                    if (args.length < 3) {
                        await twitchChat.sendChatMessage(`Invalid usage! ${event.userCommand.trigger} editgame [quoteId] [newGame]`);
                        return resolve();
                    }

                    const quoteId = parseInt(args[1]);
                    if (isNaN(quoteId)) {
                        await twitchChat.sendChatMessage(`Invalid Quote Id!`);
                        return resolve();
                    }

                    const quote = await quotesManager.getQuote(quoteId);

                    if (quote == null) {
                        await twitchChat.sendChatMessage(`Could not find a quote with id ${quoteId}`);
                        return resolve();
                    }

                    const newGameName = args.slice(2).join(" ");
                    quote.game = newGameName;

                    try {
                        await quotesManager.updateQuote(quote);
                    } catch (err) {
                        await twitchChat.sendChatMessage(`Failed to update quote ${quoteId}!`);
                        return resolve();
                    }

                    const formattedQuote = getFormattedQuoteString(quote);
                    await twitchChat.sendChatMessage(
                        `Edited ${formattedQuote}`
                    );

                    // resolve promise
                    return resolve();
                }
                case "editdate": {

                    const dateFormat = commandOptions.quoteDateFormat;

                    if (args.length < 3) {
                        await twitchChat.sendChatMessage(`Invalid usage! ${event.userCommand.trigger} editdate [quoteId] ${dateFormat}`);
                        return resolve();
                    }

                    const quoteId = parseInt(args[1]);
                    if (isNaN(quoteId)) {
                        await twitchChat.sendChatMessage(`Invalid Quote Id!`);
                        return resolve();
                    }

                    const quote = await quotesManager.getQuote(quoteId);

                    if (quote == null) {
                        await twitchChat.sendChatMessage(`Could not find a quote with id ${quoteId}`);
                        return resolve();
                    }

                    const newDate = args.slice(2).join(" ");

                    const date = moment(newDate, dateFormat);
                    if (!date.isValid()) {
                        await twitchChat.sendChatMessage(`Invalid date format!`);
                        return resolve();
                    }

                    quote.createdAt = date.toISOString();

                    try {
                        await quotesManager.updateQuote(quote);
                    } catch (err) {
                        await twitchChat.sendChatMessage(`Failed to update quote ${quoteId}!`);
                        return resolve();
                    }

                    const formattedQuote = getFormattedQuoteString(quote);
                    await twitchChat.sendChatMessage(
                        `Edited ${formattedQuote}`
                    );

                    // resolve promise
                    return resolve();
                }
                case "edituser": {
                    if (args.length < 3) {
                        await twitchChat.sendChatMessage(
                            `Invalid usage! ${event.userCommand.trigger} edituser [quoteId] [newUsername]`);
                        return resolve();
                    }

                    const quoteId = parseInt(args[1]);
                    if (isNaN(quoteId)) {
                        await twitchChat.sendChatMessage(
                            `Invalid Quote Id!`);
                        return resolve();
                    }

                    const quote = await quotesManager.getQuote(quoteId);

                    if (quote == null) {
                        await twitchChat.sendChatMessage(
                            `Could not find a quote with id ${quoteId}`);
                        return resolve();
                    }

                    const newUser = args[2].replace(/@/g, "");
                    quote.originator = newUser;

                    try {
                        await quotesManager.updateQuote(quote);
                    } catch (err) {
                        await twitchChat.sendChatMessage(
                            `Failed to update quote ${quoteId}!`);
                        return resolve();
                    }

                    const formattedQuote = getFormattedQuoteString(quote);
                    await twitchChat.sendChatMessage(
                        `Edited ${formattedQuote}`
                    );

                    // resolve promise
                    return resolve();
                }
                default: {

                    // Fallback
                    const quote = await quotesManager.getRandomQuote();

                    if (quote) {
                        const formattedQuote = getFormattedQuoteString(quote);
                        await twitchChat.sendChatMessage(formattedQuote);
                        sendToTTS(formattedQuote);

                        logger.debug(`We pulled a quote by id: ${formattedQuote}`);
                    } else {
                        await twitchChat.sendChatMessage(`Could not find a random quote!`);
                    }
                    return resolve();
                }
            }
        });
    }
};
