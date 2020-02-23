"use strict";

const { ipcMain } = require("electron");
const chat = require("../mixer-chat.js");
const profileManager = require("../profile-manager");
const logger = require("../../logwrapper");
const replaceVariableManager = require("../../variables/replace-variable-manager");
const emotesManager = require("../emotes-manager");
const accountAccess = require("../account-access");

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
        let username = trigger.metadata.username;
        let messageArray = [];

        // Replace vars
        if (populateReplaceVars) {
            logger.debug("Populating string with replace vars...");
            try {
                //message = await util.populateStringWithTriggerData(message, trigger);

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
            chat.clearChatMessages();
            break;
        case "/giveaway":
            chat.chatGiveaway();
            break;
        case "/timeout": {
            logger.debug("timing out user " + target + " for " + arg2);
            chat.timeout(target, arg2);
            break;
        }
        case "/ban":
            chat.changeUserRole(target, "Banned", "Add");
            break;
        case "/unban":
            chat.changeUserRole(target, "Banned", "Remove");
            break;
        case "/mod":
            chat.changeUserRole(target, "Mod", "Add");
            break;
        case "/unmod":
            chat.changeUserRole(target, "Mod", "Remove");
            break;
        case "/purge":
            chat.chatPurge(target);
            break;
        case "/settitle": {
            messageArray.splice(0, 1);
            let title = messageArray.join(" ");
            chat.updateStreamTitle(title);
            break;
        }
        case "/setgame": {
            messageArray.splice(0, 1);
            let game = messageArray.join(" ");
            chat.updateStreamGame(game);
            break;
        }
        case "/setaudience": {
            let normalizedArg = arg1 != null ? arg1.toLowerCase() : "";
            if (
                normalizedArg === "family" ||
          normalizedArg === "teen" ||
          normalizedArg === "18+"
            ) {
                chat.updateStreamAudience(normalizedArg);
            }
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
                chat.smartSend(messageArray.join(" "), whisper, chatter);

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

                    chat.smartSend(messageText, target, chatter);

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
            if (whisper != null && whisper !== "") {
                whisper = whisper.replace("$(user)", username);
            }

            chat.smartSend(message, whisper, chatter);
        }
    } catch (err) {
        renderWindow.webContents.send(
            "error",
            "There was an error sending a chat message."
        );
        logger.error(err);
    }
}

// This handles any major message logic we need to do befor sending it over to the UI
function uiChatMessage(data) {
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
    messageArr.forEach(chatMessage => {
        let messageSegments = chatMessage.message.message;

        messageSegments.forEach(segment => {
            if (segment.type === "emoticon") {
                // Pull in the emoticon or partner emoticon.
                let emoticonSource = segment.source,
                    emoticonPack = segment.pack,
                    emoticonCoordX = segment.coords.x,
                    emoticonCoordY = segment.coords.y;

                let styleObj = {
                    height: "24px",
                    width: "24px",
                    "background-position": `-${emoticonCoordX}px -${emoticonCoordY}px`,
                    display: "inline-block"
                };

                if (emoticonSource === "builtin") {
                    styleObj[
                        "background-image"
                    ] = `url(https://mixer.com/_latest/emoticons/${emoticonPack}.png)`;
                } else if (emoticonSource === "external") {
                    styleObj["background-image"] = `url(${emoticonPack})`;
                }

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

                    for (let channelEmote of emoteData.channelEmotes) {
                        if (channelEmote.code === word) {
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
        });

        if (chatMessage.message.meta.whisper === true) {
            previousWhisperSender = chatMessage.user_name;
        }

        // Send completed packet to UI.
        if (renderWindow) {
            renderWindow.webContents.send('chatMessage', chatMessage);
        }
    });
}

// Get Chat History
// This grabs chat history for the channel. Useful on initial connection to grab pre-existing messages.
function uiGetChatHistory(streamerClient) {
    logger.info("Attempting to get chat history");
    let dbAuth = profileManager.getJsonDbInProfile("/auth"),
        streamer = dbAuth.getData("/streamer");

    streamerClient
        .request("GET", "chats/" + streamer["channelId"] + "/history")
        .then(
            messages => {
                // Send to UI to show in chat window.
                uiChatMessage(messages.body);
                logger.info("Chat history successfully updated.");
            },
            function(err) {
                logger.info("Error getting chat history.");
                logger.error(err);
            }
        );
}


// Chat User List Refresh
// This will pull a brand new list of chat users and send it over to the UI for the chat window.
async function uiChatUserRefresh() {

    let chatUsers;

    try {
        chatUsers = await chat.getCurrentViewerListV2();
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

// This will send a list of commands in a whipser to someone.
function commandList(trigger) {
    // Get commands
    let dbCommands = chat.getCommandCache();
    let activeCommands = dbCommands["Active"];
    let commandArray = [];

    let whisperTo = trigger.metadata.username;

    // Loop through commands and let's put together a list.
    for (let command in activeCommands) {
        if (activeCommands.hasOwnProperty(command)) {
            command = activeCommands[command];
            let trigger = command["trigger"];

            // Push each trigger to the command array.
            commandArray.push(trigger);
        }
    }

    // Let's split up the string into 275 character chunks.
    // Note the actual limit is 360 characters, but we're doing 275 just to be on the safe side.
    let commandString = "Commands: " + commandArray.join(', ');
    let limit = 275;
    let regex = new RegExp(`([^]{1,${limit}})(, |$)`, "g");
    let out = commandString
        .replace(regex, "|$1")
        .slice(1)
        .split("|");
    let message = out.map(l => `${l}`);

    // Alright, lets send off each packet.
    for (let chunk in message) {
        if (chunk != null && chunk.length > 0) {
            chat.whisper("bot", whisperTo, message[chunk]);
        }
    }
}

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
exports.uiGetChatHistory = uiGetChatHistory;
exports.commandList = commandList;
