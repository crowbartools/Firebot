'use strict';

const {ipcMain} = require('electron');
const chat = require('../mixer-chat.js');
const util = require('../../utility');
const dataAccess = require('../data-access.js');
const request = require('request');


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

// This will process a chat effect to send a message to Mixer.
function textProcessor(effect, trigger) {
    try {
        // Get user specific settings
        let message = effect.message;
        let chatter = effect.chatter;
        let whisper = effect.whisper;
        let username = trigger.metadata.username;
        let messageArray = [];

        // Replace 'user' varibles with username
        message = util.populateStringWithTriggerData(message, trigger);

        // Try to get the first word of the message so we can compare against commands.
        let command = message.substr(0, message.indexOf(' '));
        if (command === "" || command === " ") {
            // This happens when there is only one word in the message. In this case, just set command to the full message.
            command = message;
        }

        // Now let's see if the first word is a mixer command...
        switch (command) {
        case "/clear":
            chat.clearChatMessages();
            break;
        case "/giveaway":
            chat.chatGiveaway();
            break;
        case "/timeout":
            messageArray = message.split(' ');
            chat.timeout(messageArray[1], messageArray[2]);
            break;
        case "/ban":
            messageArray = message.split(' ');
            chat.changeUserRole(messageArray[1], 'Banned', 'Add');
            break;
        case "/unban":
            messageArray = message.split(' ');
            chat.changeUserRole(messageArray[1], 'Banned', 'Remove');
            break;
        case "/mod":
            messageArray = message.split(' ');
            chat.changeUserRole(messageArray[1], 'Mod', 'Add');
            break;
        case "/unmod":
            messageArray = message.split(' ');
            chat.changeUserRole(messageArray[1], 'Mod', 'Remove');
            break;
        case "/purge":
            messageArray = message.split(' ');
            chat.chatPurge(messageArray[1]);
            break;
        default:
            // Whispers and broadcasts
            if (whisper !== null && whisper !== undefined && whisper !== "") {
                whisper = whisper.replace('$(user)', username);
                chat.whisper(chatter, whisper, message);
            } else {
                chat.broadcast(chatter, message);
            }
        }
    } catch (err) {
        renderWindow.webContents.send('error', "There was an error sending a chat message.");
        console.log(err);
    }
}

// This compiles the HTML for a chat message and sends it over to the ui to post.
// HTML is compiled here instead of UI because theoretically it should be faster than having the renderer do it.
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
    Object.keys(messageArr).forEach((key) => {
        let chatMessage = messageArr[key],
            messageHTML = "";

        // This takes the various parts of the chat message and pieces it together into an HTML string.
        Object.keys(chatMessage.message.message).forEach((messagePiece) => {
            let message = chatMessage.message.message[messagePiece],
                type = message.type;

            if (type === "text") {
                // Sanitize the message so people can inject images and such.
                let messageTextOrig = message.data;
                let messageText = messageTextOrig.replace(/([<>&])/g, function (chr) {
                    return chr === "<" ? "&lt;" : chr === ">" ? "&gt;" : "&amp;";
                });
                messageHTML += messageText;
            } else if (type === "emoticon") {
                // Pull in the emoticon or partner emoticon.
                let emoticonSource = message.source;
                let emoticonPack = message.pack;
                let emoticonCoordX = message.coords.x;
                let emoticonCoordY = message.coords.y;
                if (emoticonSource === "builtin") {
                    messageHTML += '<div class="chatEmoticon" style="background-image:url(https://Mixer.com/_latest/emoticons/' + emoticonPack + '.png); background-position:-' + emoticonCoordX + 'px -' + emoticonCoordY + 'px; height:24px; width:24px; display:inline-block;"></div>';
                } else if (emoticonSource === "external") {
                    messageHTML += '<div class="chatEmoticon" style="background-image:url(' + emoticonPack + '); background-position:-' + emoticonCoordX + 'px -' + emoticonCoordY + 'px; height:24px; width:24px; display:inline-block;"></div>';
                }
            } else if (type === "link") {
                let chatLinkOrig = message.text;
                let chatLink = chatLinkOrig.replace(/(<([^>]+)>)/ig, "");
                messageHTML += chatLink;
            } else if (type === "tag") {
                let userTag = message.text;
                messageHTML += userTag;
            }
        });

        // Push HTML string to chat packet.
        chatMessage.messageHTML = messageHTML;

        // Send completed packet to UI.
        renderWindow.webContents.send('chatMessage', chatMessage);
    });
}

// Get Chat History
// This grabs chat history for the channel. Useful on initial connection to grab pre-existing messages.
function uiGetChatHistory(streamerClient) {
    console.log('Attempting to get chat history');
    let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth"),
        streamer = dbAuth.getData('/streamer');

    streamerClient.request('GET', 'chats/' + streamer['channelId'] + '/history')
        .then(messages => {
            // Send to UI to show in chat window.
            uiChatMessage(messages.body);
            console.log('Chat history successfully updated.');
        }, function (err) {
            console.log('Error getting chat history.');
            console.log(err);
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
            console.log('Continuing to build chat userlist. On page ' + page + ' currently.');
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
            console.log('Chat userlist refreshed.');
        }
    });
}

// UI Chat Message Sent
// This receives chat messages from the UI chat window.
ipcMain.on('uiChatMessage', function(event, data) {
    textProcessor(data, {metadata: {username: "Streamer"}});
});


// Export Functions
exports.send = textProcessor;
exports.parseArg = parseArg;
exports.uiChatMessage = uiChatMessage;
exports.uiChatUserRefresh = uiChatUserRefresh;
exports.uiGetChatHistory = uiGetChatHistory;