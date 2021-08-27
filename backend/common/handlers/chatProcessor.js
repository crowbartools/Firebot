"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const replaceVariableManager = require("../../variables/replace-variable-manager");
const emotesManager = require("../emotes-manager");
const accountAccess = require("../account-access");
const imgProbe = require('probe-image-size');

const twitchApi = require("../../twitch-api/api");
const twitchChat = require("../../chat/twitch-chat");

// This will parse the message string and build an array of Arg numbers the user wants to use.
function parseArg(str) {
    let index = [];
    let newTxt = str.split("(");
    for (let i = 1; i < newTxt.length; i++) {
        let text = newTxt[i].split(")")[0];

        // This will strip the argument down to the specific number.
        if (text.includes("arg")) {
            // Replace "arg" with nothing.
            text = text.replace("arg", "");
            index.push(parseInt(text));
        }
    }
    return index;
}

// Inject Whisper
// This builds out a fake chat packet to inject into the ui chat message queue.
// This is used to display OUTGOING whispers which normally we dont get events for.
function injectWhisper(chatter, target, message) {
    let data = {
        channel: 0,
        id: 0,
        user_name: 'Streamer', // eslint-disable-line
        user_id: 0, // eslint-disable-line
        user_roles: ['Owner', 'Mod', 'User'], // eslint-disable-line
        user_level: 0, // eslint-disable-line
        user_avatar: 'url', // eslint-disable-line
        target: target,
        message: {
            message: [
                {
                    type: "text",
                    data: message,
                    firebotSubsegments: [
                        {
                            type: "rawText",
                            text: message
                        }
                    ]
                }
            ],
            meta: {
                whisper: true
            }
        },
        messageHTML: message
    };

    let streamer = accountAccess.getAccounts().streamer;
    let bot = accountAccess.getAccounts().bot;

    // Fill out non-chatter specific info.
    data.channel = streamer.channelId;
    data.id = Date.now();

    // Fill out variables based on chatter.
    if (chatter === "Streamer") {
        data.user_name = streamer.username; // eslint-disable-line
        data.user_roles = ['Owner']; // eslint-disable-line
        data.user_avatar = streamer.avatar; // eslint-disable-line
    } else if (chatter === "Bot") {
        data.user_name = bot.username; // eslint-disable-line
        data.user_roles = ['Mod']; // eslint-disable-line
        data.user_avatar = bot.avatar; // eslint-disable-line
    }

    // Send to ui
    renderWindow.webContents.send("chatMessage", data);
}

let previousWhisperSender = "";

// This will process a chat effect to send a message to Mixer.
async function textProcessor(effect, trigger, populateReplaceVars = true) {
    try {
    // Get user specific settings
        let message = effect.message;
        let chatter = effect.chatter;
        let whisper = effect.whisper;
        let messageArray = [];

        // Replace vars
        if (populateReplaceVars) {
            logger.debug("Populating string with replace vars...");
            try {
                message = await replaceVariableManager.evaluateText(message, trigger, { type: trigger.type });
            } catch (err) {
                logger.error(err);
            }
        }

        if (message.length > 360) {
            message = message.substring(0, 359);
        }

        logger.debug("checking for commands in message: ", message);
        // Try to get the first word of the message so we can compare against commands.
        let command = message.substr(0, message.indexOf(" "));
        if (command === "" || command === " ") {
            // This happens when there is only one word in the message. In this case, just set command to the full message.
            command = message;
        }

        // Now let's see if the first word is a mixer command...
        messageArray = message.split(" ");
        let arg1 = messageArray[1],
            arg2 = messageArray[2];

        let target = arg1 != null ? arg1.replace("@", "") : "";

        switch (command) {
        case "/clear":
            twitchChat.clearChat();
            break;
        case "/timeout": {
            logger.debug("timing out user " + target + " for " + arg2);
            twitchChat.timeoutUser(target, arg2);
            break;
        }
        case "/ban":
            twitchChat.banUser(target);
            break;
        case "/unban":
            twitchChat.unbanUser(target);
            break;
        case "/mod":
            twitchChat.modUser(target);
            break;
        case "/unmod":
            twitchChat.unmodUser(target);
            break;
        case "/purge":
            twitchChat.timeoutUser(target, 1);
            break;
        case "/followers":
            twitchChat.enableFollowersOnly(arg1);
            break;
        case "/followersoff":
            twitchChat.disableFollowersOnly();
            break;
        case "/emoteonly":
            twitchChat.enableEmoteOnly();
            break;
        case "/emoteonlyoff":
            twitchChat.disableEmoteOnly();
            break;
        case "/subscribers":
            twitchChat.enableSubscribersOnly();
            break;
        case "/subscribersoff":
            twitchChat.disableSubscribersOnly();
            break;
        case "/slow":
            twitchChat.enableSlowMode(arg1);
            break;
        case "/slowoff":
            twitchChat.disableSlowMode();
            break;
        case "/ad":
            await twitchApi.channels.triggerAdBreak();
            break;
        case "/settitle": {
            messageArray.splice(0, 1);
            let title = messageArray.join(" ");
            await twitchApi.channels.updateChannelInformation(title);
            break;
        }
        case "/setgame": {
            messageArray.splice(0, 1);
            const game = messageArray.join(" ");
            const categories = await twitchApi.categories.searchCategories(game);
            await twitchApi.channels.updateChannelInformation(undefined, categories[0].id);

            break;
        }
        case "/whisper":
        case "/w":
        // This occurs if someone puts a whisper into the chat feed window.
        // Split message up so we can get the command and person we're sending to.
        // Then remove the command and person, leaving the message.
            whisper = target;
            messageArray.splice(0, 2);

            try {
                // Send to mixer.
                twitchChat.sendChatMessage(messageArray.join(" "), whisper, chatter);

                // Send to UI to inject outgoing whisper.
                injectWhisper(chatter, whisper, messageArray.join(" "));
            } catch (err) {
                logger.error("error while whispering", err);
            }

            break;
        case "/r":
            if (previousWhisperSender === "") {
                renderWindow.webContents.send(
                    "error",
                    "Cannot use /r as no one has whispered you or your bot yet."
                );
                return;
            }

            try {
                messageArray = message.split(" ");

                //remove command from array
                messageArray.splice(0, 1);

                let target = previousWhisperSender;

                let messageText = messageArray.join(" ");

                if (messageText.length > 0) {

                    twitchChat.sendChatMessage(messageText, target, chatter);

                    // Send to UI to inject outgoing whisper.
                    injectWhisper(chatter, target, messageText);
                }
            } catch (err) {
                logger.error("error while whispering", err);
            }

            break;
        default:
            // Whispers and broadcasts
            // This occurs if a whisper is sent via button chat effect, or if a regular chat message is sent via chat effect or chat window.
            logger.debug("attempting to send chat");
            twitchChat.sendChatMessage(message, whisper, chatter);
        }
    } catch (err) {
        renderWindow.webContents.send(
            "error",
            "There was an error sending a chat message."
        );
        logger.error(err);
    }
}

async function getEmotePackDimensions(packUrl) {
    try {
        let probeResult = await imgProbe(packUrl);
        return {
            width: probeResult.width,
            height: probeResult.height
        };
    } catch (error) {
        logger.debug("Error getting emote pack dimensions", error);
        return null;
    }
}

// This handles any major message logic we need to do befor sending it over to the UI
async function uiChatMessage(data) {
    let messageArr = [];

    // Mixer doesn't send chat messages in an array, but with chat history they do.
    // So if we get a single message, throw it into an array to standardize the two.
    if (data.length === undefined) {
        data.date = new Date();
        data.historical = false;
        messageArr.push(data);
    } else {
        messageArr = data;

        messageArr.forEach(m => {
            //tag historical messages as such
            m.historical = true;
        });
    }

    // Loop through all messages in given data. Could contain one or more.
    for (let chatMessage of messageArr) {
        let messageSegments = chatMessage.message.message;
        for (let segment of messageSegments) {
            if (segment.type === "emoticon") {
                // Pull in the emoticon or partner emoticon.
                let emoticonSource = segment.source,
                    emoticonPack = segment.pack,
                    emoticonCoordX = segment.coords.x,
                    emoticonCoordY = segment.coords.y,
                    emoticonWidth = segment.coords.width;

                let packUrl = emoticonSource === "builtin" ? `https://mixer.com/_latest/emoticons/${emoticonPack}.png`
                    : emoticonPack;

                let size = emoticonWidth > 24 ? 28 : 24;

                let scale = size / emoticonWidth;

                let packDimensions = await getEmotePackDimensions(packUrl);

                let sheetWidth, sheetHeight;
                if (packDimensions) {
                    sheetWidth = packDimensions.width;
                    sheetHeight = packDimensions.height;
                }

                let backgroundSize = scale !== 1 && sheetHeight && sheetWidth ?
                    `${scale * sheetWidth}px ${scale * sheetHeight}px`
                    : undefined;

                let styleObj = {
                    height: `${size}px`,
                    width: `${size}px`,
                    "background-position": `-${scale * emoticonCoordX}px -${scale * emoticonCoordY}px`,
                    "background-image": `url(${packUrl})`,
                    "background-size": backgroundSize,
                    display: "inline-block"
                };

                segment.emoticonStyles = styleObj;
            }

            // Stickers!
            if (segment.type === "image") {
                let styleObj = {
                    "height": "64px",
                    "width": "64px",
                    "display": "block",
                    "margin": "auto"
                };

                // Set the icon for the currency used.
                if (chatMessage.message.meta.skill.currency === "Sparks") {
                    segment.currencyIcon = "fas fa-bolt";
                } else {
                    segment.currencyIcon = "fas fa-fire";
                }

                segment.stickerStyles = styleObj;
            }


            if (segment.type === "text") {

                const emoteData = emotesManager.getEmotes();

                let firebotData = [];

                // store consecutive words that arent emotes as one string
                let currentWordString = "";
                let words = segment.text.split(" ");
                for (let word of words) {

                    let emote = null;
                    let foundEmote = false;
                    let emoteIsGlobal = false;

                    if (emoteData) {
                        for (let channelEmote of emoteData.channelEmotes) {
                            if (channelEmote.name === word) {
                                emote = channelEmote;
                                foundEmote = true;
                                break;
                            }
                        }

                        // didnt find a channel emote, check globals
                        if (!foundEmote) {
                            for (let globalEmote of emoteData.globalEmotes) {
                                if (globalEmote.code === word) {
                                    emote = globalEmote;
                                    emoteIsGlobal = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (emote) {

                        //check if we have any consecutive words saved up and reset it
                        if (currentWordString.length > 0) {
                            firebotData.push({ type: "rawText", text: currentWordString.trim() });
                        }
                        currentWordString = "";

                        let url = "";
                        if (emoteIsGlobal) {
                            url = emoteData.globalEmoteUrlTemplate.replace("{{emoteId}}", emote.id);
                        } else {
                            url = emoteData.channelEmoteUrlTemplate.replace("{{emoteId}}", emote.id);
                        }

                        firebotData.push({
                            type: "elixrEmote",
                            url: url,
                            code: emote.code,
                            maxSize: emote.maxSize,
                            animated: emote.animated
                        });

                    } else {
                        //no emote found, add raw text to current word string
                        currentWordString += (word + " ");
                    }
                }

                // make sure any trailing words are added
                if (currentWordString.length > 0) {
                    firebotData.push({ type: "rawText", text: currentWordString.trim() });
                }

                segment.firebotSubsegments = firebotData;
            }
        }

        if (chatMessage.message.meta.whisper === true) {
            previousWhisperSender = chatMessage.user_name;
        }

        // Send completed packet to UI.
        if (renderWindow) {
            renderWindow.webContents.send('chatMessage', chatMessage);
        }
    }
}

// Chat User List Refresh
// This will pull a brand new list of chat users and send it over to the UI for the chat window.
async function uiChatUserRefresh() {

    let chatUsers;

    try {
        chatUsers = await twitchChat.getViewerList();
    } catch (err) {
        logger.warn(err);
        return;
    }

    // We're at the end of the list.
    // Send completed packet to UI.
    let refreshPacket = {
        fbEvent: 'UsersRefresh',
        chatUsers: chatUsers
    };
    renderWindow.webContents.send('chatUpdate', refreshPacket);
    logger.info('Chat userlist refreshed.');
}

twitchChat.on("connected", async () => {
    await uiChatUserRefresh();
});

// UI Chat Message Sent
// This receives chat messages from the UI chat window.
ipcMain.on("uiChatMessage", function(event, data) {
    textProcessor(data, { metadata: { username: "Streamer" } }, false).then(
        () => {},
        err => {
            logger.debug("text processor rejected", err);
        }
    );
});

// Export Functions
exports.send = textProcessor;
exports.parseArg = parseArg;
exports.uiChatMessage = uiChatMessage;
exports.uiChatUserRefresh = uiChatUserRefresh;
