'use strict';

const {ipcMain} = require('electron');
const chat = require('../mixer-chat.js');
const util = require('../../utility');
const dataAccess = require('../data-access.js');
const request = require('request');
const logger = require('../../logwrapper');


// This will parse the message string and build an array of Arg numbers the user wants to use.
function parseArg(str) {
    let index = [];
    let newTxt = str.split('(');
    for (let i = 1; i < newTxt.length; i++) {
        let text = newTxt[i].split(')')[0];

        // This will strip the argument down to the specific number.
        if (text.includes('arg')) {
            // Replace "arg" with nothing.
            text = text.replace('arg', '');
            index.push(parseInt(text));
        }
    }
    return index;
}

// Inject Whisper
// This builds out a fake chat packet to inject into the ui chat message queue.
// This is used to display OUTGOING whispers which normally we dont get events for.
function injectWhisper(chatter, target, message) {
    let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth"),
        streamerJson = [],
        botJson = [],
        data = {
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
                        data: message
                    }
                ],
                meta: {
                    whisper: true
                }
            },
            messageHTML: message
        };

    try {
        streamerJson = dbAuth.getData('/streamer');
    } catch (err) {
        // Stop here because the streamer isn't logged in.
        logger.warn(err);
        return;
    }

    try {
        botJson = dbAuth.getData('/bot');
    } catch (err) {
        logger.warn(err);
        if (chatter === "Bot") {
            // If we cant pull bot info, and somehow they sent the message as a bot... stop here.
            return;
        }
    }

    // Fill out non-chatter specific info.
    data.channel = streamerJson.channelId;
    data.id = Date.now();

    // Fill out variables based on chatter.
    if (chatter === "Streamer") {
        data.user_name = streamerJson.username; // eslint-disable-line
        data.user_roles = ['Owner']; // eslint-disable-line
        data.user_avatar = streamerJson.avatar; // eslint-disable-line
    } else if (chatter === "Bot") {
        data.user_name = botJson.username; // eslint-disable-line
        data.user_roles = ['Mod']; // eslint-disable-line
        data.user_avatar = botJson.avatar; // eslint-disable-line
    }

    // Send to ui
    renderWindow.webContents.send('chatMessage', data);
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
                message = await util.populateStringWithTriggerData(message, trigger);
            } catch (err) {
                logger.error("Error while populating string", err);
            }
        }

        if (message.length > 360) {
            message = message.substring(0, 359);
        }

        logger.debug("checking for commands in message: ", message);
        // Try to get the first word of the message so we can compare against commands.
        let command = message.substr(0, message.indexOf(' '));
        if (command === "" || command === " ") {
            // This happens when there is only one word in the message. In this case, just set command to the full message.
            command = message;
        }

        // Now let's see if the first word is a mixer command...
        messageArray = message.split(' ');
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
            chat.changeUserRole(target, 'Banned', 'Add');
            break;
        case "/unban":
            chat.changeUserRole(target, 'Banned', 'Remove');
            break;
        case "/mod":
            chat.changeUserRole(target, 'Mod', 'Add');
            break;
        case "/unmod":
            chat.changeUserRole(target, 'Mod', 'Remove');
            break;
        case "/purge":
            chat.chatPurge(target);
            break;
        case "/settitle": {
            messageArray.splice(0, 1);
            let title = messageArray.join(' ');
            chat.updateStreamTitle(title);
            break;
        }
        case "/setgame": {
            messageArray.splice(0, 1);
            let game = messageArray.join(' ');
            chat.updateStreamGame(game);
            break;
        }
        case "/setaudience": {
            let normalizedArg = arg1 != null ? arg1.toLowerCase() : "";
            if (normalizedArg === "family" || normalizedArg === "teen" || normalizedArg === "18+") {
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
                chat.whisper(chatter, whisper, messageArray.join(' '));

                // Send to UI to inject outgoing whisper.
                injectWhisper(chatter, whisper, messageArray.join(' '));
            } catch (err) {
                logger.error("error while whispering", err);
            }

            break;
        case "/r":
            if (previousWhisperSender === "") {
                renderWindow.webContents.send('error', "Cannot use /r as no one has whispered you or your bot yet.");
                return;
            }

            try {

                messageArray = message.split(' ');

                //remove command from array
                messageArray.splice(0, 1);

                let target = previousWhisperSender;

                let messageText = messageArray.join(' ');

                if (messageText.length > 0) {
                    chat.whisper(chatter, target, messageText);

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
            if (whisper !== null && whisper !== undefined && whisper !== "") {
                whisper = whisper.replace('$(user)', username);
                chat.whisper(chatter, whisper, message);
            } else {
                chat.broadcast(chatter, message);
            }
        }
    } catch (err) {
        renderWindow.webContents.send('error', "There was an error sending a chat message.");
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

        messageArr.forEach((m) => {
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
                    "height": "24px",
                    "width": "24px",
                    "background-position": `-${emoticonCoordX}px -${emoticonCoordY}px`,
                    "display": "inline-block"
                };

                if (emoticonSource === "builtin") {
                    styleObj["background-image"] = `url(https://mixer.com/_latest/emoticons/${emoticonPack}.png)`;
                } else if (emoticonSource === "external") {
                    styleObj["background-image"] = `url(${emoticonPack})`;
                }

                segment.emoticonStyles = styleObj;
            }
        });

        if (chatMessage.message.meta.whisper === true) {
            previousWhisperSender = chatMessage.user_name;
        }

        // Send completed packet to UI.
        renderWindow.webContents.send('chatMessage', chatMessage);
    });
}

// Get Chat History
// This grabs chat history for the channel. Useful on initial connection to grab pre-existing messages.
function uiGetChatHistory(streamerClient) {
    logger.info('Attempting to get chat history');
    let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth"),
        streamer = dbAuth.getData('/streamer');

    streamerClient.request('GET', 'chats/' + streamer['channelId'] + '/history')
        .then(messages => {
            // Send to UI to show in chat window.
            uiChatMessage(messages.body);
            logger.info('Chat history successfully updated.');
        }, function (err) {
            logger.info('Error getting chat history.');
            logger.error(err);
        });
}

// Chat User List Refresh
// This will pull a brand new list of chat users and send it over to the UI for the chat window.
function uiChatUserRefresh(page, chatUsers) {
    let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth"),
        channelId = dbAuth.getData('/streamer/channelId'),
        accessToken = dbAuth.getData('/streamer/accessToken'),
        refreshPacket = [];

    // If no page passed, start on the first page.
    if (page === null || page === undefined) {
        page = 0;
    }

    // If chatUsers is not provided, we're starting a new list.
    if (chatUsers === null || chatUsers === undefined) {
        chatUsers = [];
    }

    // Request chat user list.
    request({
        url: 'https://mixer.com/api/v1/chats/' + channelId + '/users?limit=100&page=' + page,
        auth: {
            'bearer': accessToken
        }
    }, function (err, res) {
        let data = JSON.parse(res.body);

        // Loop through returned users and push them to the chat user list.
        Object.keys(data).forEach((user) => {
            user = data[user];
            // Mixer has named user_roles & username different things depending on how you pull user info. Standardize it here.
            user.user_roles = user.userRoles; // eslint-disable-line
            user.username = user.userName;// eslint-disable-line
            chatUsers.push(user);
        });

        // If this set of data is at max length, then run this function again on the next page.
        if (data.length === 100) {
            logger.info('Continuing to build chat userlist. On page ' + page + ' currently.');
            page = page + 1;
            uiChatUserRefresh(page, chatUsers);
        } else {
            // We're at the end of the list.
            // Send completed packet to UI.
            refreshPacket = {
                fbEvent: 'UsersRefresh',
                chatUsers: chatUsers
            };
            renderWindow.webContents.send('chatUpdate', refreshPacket);
            logger.info('Chat userlist refreshed.');
        }
    });
}

// This will send a list of commands in a whipser to someone.
function commandList(trigger) {
    // Get commands
    let dbCommands = chat.getCommandCache();
    let activeCommands = dbCommands['Active'];
    let commandArray = [];

    let whisperTo = trigger.metadata.username;

    // Loop through commands and let's put together a list.
    for (let command in activeCommands) {
        if (activeCommands.hasOwnProperty(command)) {
            command = activeCommands[command];
            let trigger = command['trigger'];

            // Push each trigger to the command array.
            commandArray.push(trigger);
        }
    }

    // Let's split up the string into 275 character chunks.
    // Note the actual limit is 360 characters, but we're doing 275 just to be on the safe side.
    let commandString = commandArray.join(', ');
    let limit = 275;
    let regex = new RegExp(`([^]{1,${limit}})(, |$)`, "g");
    let out = commandString.replace(regex, "|$1").slice(1).split("|");
    let message = out.map(l => `${l}`);

    // Alright, lets send off each packet.
    for (let chunk in message) {
        if (chunk != null && chunk.length > 0) {
            chat.whisper('bot', whisperTo, message[chunk]);
        }
    }
}

// UI Chat Message Sent
// This receives chat messages from the UI chat window.
ipcMain.on('uiChatMessage', function(event, data) {
    textProcessor(data, {metadata: {username: "Streamer"}}, false).then(() => {}, (err) => {
        logger.debug("text processor rejected", err);
    });
});


// Export Functions
exports.send = textProcessor;
exports.parseArg = parseArg;
exports.uiChatMessage = uiChatMessage;
exports.uiChatUserRefresh = uiChatUserRefresh;
exports.uiGetChatHistory = uiGetChatHistory;
exports.commandList = commandList;