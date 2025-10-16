import { app } from "electron";
import moment from "moment";

import { SystemCommand } from "../../../../types/commands";
import { Quote } from "../../../../types/quotes";
import { QuoteManager } from "../../../quotes/quote-manager";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";
import * as cloudSync from "../../../cloud-sync";
import frontendCommunicator from "../../../common/frontend-communicator";
import logger from "../../../logwrapper";

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
    onTriggerEvent: async (event) => {
        const { commandOptions } = event;

        const args = event.userCommand.args;

        const getFormattedQuoteString = (quote: Quote) => {
            const prettyDate = quote.createdAt != null ? moment(quote.createdAt).format(commandOptions.quoteDateFormat) : "No Date";
            return commandOptions.quoteDisplayTemplate
                .replaceAll("{id}", quote._id.toString())
                .replaceAll("{text}", quote.text)
                .replaceAll("{author}", quote.originator)
                .replaceAll("{game}", quote.game)
                .replaceAll("{date}", prettyDate);
        };

        const sendToTTS = (text: string) => {
            if (commandOptions.useTTS) {
                //Send to TTS
                frontendCommunicator.send("read-tts", {
                    text
                });
            }
        };

        if (args.length === 0) {
            // no args, only "!quote" was issued
            const quote = await QuoteManager.getRandomQuote();

            if (quote) {
                const formattedQuote = getFormattedQuoteString(quote);
                await TwitchApi.chat.sendChatMessage(formattedQuote, null, true);
                sendToTTS(formattedQuote);

                logger.debug(`We pulled a quote by id: ${formattedQuote}`);
            } else {
                await TwitchApi.chat.sendChatMessage(`Could not find a random quote!`, null, true);
            }
            return;
        }

        const triggeredArg = args[0];

        if (event.userCommand.subcommandId === "quotelookup") {
            const quoteId = parseInt(triggeredArg);
            const quote = await QuoteManager.getQuote(quoteId);
            if (quote) {
                const formattedQuote = getFormattedQuoteString(quote);
                await TwitchApi.chat.sendChatMessage(formattedQuote, null, true);
                sendToTTS(formattedQuote);
                logger.debug(`We pulled a quote using an id: ${formattedQuote}`);
            } else {
                // If we get here, it's likely the command was used wrong. Tell the sender they done fucked up
                await TwitchApi.chat.sendChatMessage(`Sorry! We could not find a quote with that id.`, null, true);
            }
            return;
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
                    await TwitchApi.chat.sendChatMessage(`Please provide some quote text!`, null, true);
                    return;
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
                const newQuoteId = await QuoteManager.addQuote(newQuote);
                const newQuoteText = await QuoteManager.getQuote(newQuoteId);
                const formattedQuote = getFormattedQuoteString(newQuoteText);
                await TwitchApi.chat.sendChatMessage(`Added ${formattedQuote}`, null, true);
                sendToTTS(formattedQuote);
                logger.debug(`Quote #${newQuoteId} added!`);
                return;
            }
            case "remove": {
                const quoteId = parseInt(args[1]);
                if (!isNaN(quoteId)) {
                    await QuoteManager.removeQuote(quoteId);
                    await TwitchApi.chat.sendChatMessage(`Quote ${quoteId} was removed.`, null, true);
                    logger.debug(`A quote was removed: ${quoteId}`);
                    return;
                }

                await TwitchApi.chat.sendChatMessage(`Sorry! We could not find a quote with that id.`, null, true);
                logger.error('Quotes: NaN passed to remove quote command.');
                return;
            }
            case "list": {
                const streamerName = await cloudSync.syncProfileData({
                    username: event.chatMessage.username,
                    userRoles: event.chatMessage.roles,
                    profilePage: 'quotes'
                });

                await TwitchApi.chat.sendChatMessage(`Here is a list of quotes! https://firebot.app/profile/${streamerName}`, null, true);

                return;
            }
            case "search": {

                // strip first token("search") from input, and join the remaining using space as the delimiter
                const searchTerm = args.slice(1).join(" ");

                // attempt to get a random quote containing the text as an exact match
                const quote = await QuoteManager.getRandomQuoteContainingText(searchTerm);

                // quote found
                if (quote != null) {

                    // format quote
                    const formattedQuote = getFormattedQuoteString(quote);

                    // send to chat
                    await TwitchApi.chat.sendChatMessage(formattedQuote, null, true);
                    sendToTTS(formattedQuote);

                    // log (Maybe move this to the manager?)
                    logger.debug(`We pulled a quote using an id: ${formattedQuote}`);

                    // no matching quote found
                } else {
                    await TwitchApi.chat.sendChatMessage(`Sorry! We could not find a quote using those terms.`, null, true);
                }

                // resolve promise
                return;
            }
            case "searchuser": {
                const username = args[1].replace("@", "");

                const quote = await QuoteManager.getRandomQuoteByAuthor(username);

                if (quote != null) {

                    const formattedQuote = getFormattedQuoteString(quote);
                    sendToTTS(formattedQuote);
                    await TwitchApi.chat.sendChatMessage(formattedQuote, null, true);
                } else {
                    await TwitchApi.chat.sendChatMessage(`Sorry! We could not find a quote by ${username}`, null, true);
                }
                return;
            }
            case "searchgame": {
                const searchTerm = args.slice(1).join(" ");
                const quote = await QuoteManager.getRandomQuoteByGame(searchTerm);
                if (quote != null) {
                    const formattedQuote = getFormattedQuoteString(quote);
                    await TwitchApi.chat.sendChatMessage(formattedQuote, null, true);
                    sendToTTS(formattedQuote);
                } else {
                    await TwitchApi.chat.sendChatMessage(`Sorry! We could not find a quote with game ${searchTerm}`, null, true);
                }
                return;
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
                    await TwitchApi.chat.sendChatMessage(`Invalid quote date search!`, null, true);
                    return;
                }

                const quote = await QuoteManager.getRandomQuoteByDate({
                    day,
                    month,
                    year
                });

                if (quote != null) {
                    const formattedQuote = getFormattedQuoteString(quote);
                    await TwitchApi.chat.sendChatMessage(formattedQuote, null, true);
                    sendToTTS(formattedQuote);
                } else {
                    await TwitchApi.chat.sendChatMessage(`Sorry! We could not find a quote with date ${day}/${month}/${year || "*"}`, null, true);
                }
                return;
            }
            case "edittext": {
                if (args.length < 3) {
                    await TwitchApi.chat.sendChatMessage(`Invalid usage! ${event.userCommand.trigger} edittext [quoteId] [newText]`, null, true);
                    return;
                }

                const quoteId = parseInt(args[1]);
                if (isNaN(quoteId)) {
                    await TwitchApi.chat.sendChatMessage(`Invalid Quote Id!`, null, true);
                    return;
                }

                const quote = await QuoteManager.getQuote(quoteId);

                if (quote == null) {
                    await TwitchApi.chat.sendChatMessage(`Could not find a quote with id ${quoteId}`, null, true);
                    return;
                }

                const newText = args.slice(2).join(" ");
                quote.text = newText;

                try {
                    await QuoteManager.updateQuote(quote);
                } catch {
                    await TwitchApi.chat.sendChatMessage(`Failed to update quote ${quoteId}!`, null, true);
                    return;
                }

                const formattedQuote = getFormattedQuoteString(quote);

                await TwitchApi.chat.sendChatMessage(`Edited ${formattedQuote}`, null, true);

                // resolve promise
                return;
            }
            case "editgame": {
                if (args.length < 3) {
                    await TwitchApi.chat.sendChatMessage(`Invalid usage! ${event.userCommand.trigger} editgame [quoteId] [newGame]`, null, true);
                    return;
                }

                const quoteId = parseInt(args[1]);
                if (isNaN(quoteId)) {
                    await TwitchApi.chat.sendChatMessage(`Invalid Quote Id!`, null, true);
                    return;
                }

                const quote = await QuoteManager.getQuote(quoteId);

                if (quote == null) {
                    await TwitchApi.chat.sendChatMessage(`Could not find a quote with id ${quoteId}`, null, true);
                    return;
                }

                const newGameName = args.slice(2).join(" ");
                quote.game = newGameName;

                try {
                    await QuoteManager.updateQuote(quote);
                } catch {
                    await TwitchApi.chat.sendChatMessage(`Failed to update quote ${quoteId}!`, null, true);
                    return;
                }

                const formattedQuote = getFormattedQuoteString(quote);
                await TwitchApi.chat.sendChatMessage(`Edited ${formattedQuote}`, null, true);

                // resolve promise
                return;
            }
            case "editdate": {

                const dateFormat = commandOptions.quoteDateFormat;

                if (args.length < 3) {
                    await TwitchApi.chat.sendChatMessage(`Invalid usage! ${event.userCommand.trigger} editdate [quoteId] ${dateFormat}`, null, true);
                    return;
                }

                const quoteId = parseInt(args[1]);
                if (isNaN(quoteId)) {
                    await TwitchApi.chat.sendChatMessage(`Invalid Quote Id!`, null, true);
                    return;
                }

                const quote = await QuoteManager.getQuote(quoteId);

                if (quote == null) {
                    await TwitchApi.chat.sendChatMessage(`Could not find a quote with id ${quoteId}`, null, true);
                    return;
                }

                const newDate = args.slice(2).join(" ");

                const date = moment(newDate, dateFormat);
                if (!date.isValid()) {
                    await TwitchApi.chat.sendChatMessage(`Invalid date format!`, null, true);
                    return;
                }

                quote.createdAt = date.toISOString();

                try {
                    await QuoteManager.updateQuote(quote);
                } catch {
                    await TwitchApi.chat.sendChatMessage(`Failed to update quote ${quoteId}!`, null, true);
                    return;
                }

                const formattedQuote = getFormattedQuoteString(quote);
                await TwitchApi.chat.sendChatMessage(`Edited ${formattedQuote}`, null, true);

                // resolve promise
                return;
            }
            case "edituser": {
                if (args.length < 3) {
                    await TwitchApi.chat.sendChatMessage(
                        `Invalid usage! ${event.userCommand.trigger} edituser [quoteId] [newUsername]`,
                        null,
                        true
                    );
                    return;
                }

                const quoteId = parseInt(args[1]);
                if (isNaN(quoteId)) {
                    await TwitchApi.chat.sendChatMessage(`Invalid Quote Id!`, null, true);
                    return;
                }

                const quote = await QuoteManager.getQuote(quoteId);

                if (quote == null) {
                    await TwitchApi.chat.sendChatMessage(`Could not find a quote with id ${quoteId}`, null, true);
                    return;
                }

                const newUser = args[2].replace(/@/g, "");
                quote.originator = newUser;

                try {
                    await QuoteManager.updateQuote(quote);
                } catch {
                    await TwitchApi.chat.sendChatMessage(`Failed to update quote ${quoteId}!`, null, true);
                    return;
                }

                const formattedQuote = getFormattedQuoteString(quote);
                await TwitchApi.chat.sendChatMessage(`Edited ${formattedQuote}`, null, true);

                // resolve promise
                return;
            }
            default: {
                // Fallback
                const quote = await QuoteManager.getRandomQuote();

                if (quote) {
                    const formattedQuote = getFormattedQuoteString(quote);
                    await TwitchApi.chat.sendChatMessage(formattedQuote, null, true);
                    sendToTTS(formattedQuote);

                    logger.debug(`We pulled a quote by id: ${formattedQuote}`);
                } else {
                    await TwitchApi.chat.sendChatMessage(`Could not find a random quote!`, null, true);
                }
            }
        }
    }
};