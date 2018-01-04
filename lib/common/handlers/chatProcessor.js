'use strict';

const chat = require('../mixer-chat.js');
const util = require('../../utility');


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

        // Replace 'user' varibles with username
        message = util.populateStringWithTriggerData(message, trigger);

        // Send off the chat packet.
        if (whisper !== null && whisper !== undefined && whisper !== "") {
            // Send a whisper
            whisper = whisper.replace('$(user)', username);

            console.log('sending text', chatter, whisper, message);
            chat.whisper(chatter, whisper, message);
        } else {
            // Send a broadcast
            console.log('sending broadcast', chatter, message);
            chat.broadcast(chatter, message);
        }
    } catch (err) {
        renderWindow.webContents.send('error', "There was an error sending a chat message. If you are testing a chat button, please make sure Interactive is connected.");
        console.log(err);
    }
}

// This compiles the HTML for a chat message and sends it over to the ui to post.
// HTML is compiled here instead of UI because theoretically it should be faster than having the renderer do it.
function uiChatMessage(data) {

    // This will hold a compiled HTML string of the chat message.
    let messageHTML = "",
        messageTemplate = "",
        me = "non-italic",
        whisper = "noWhisper";

    // This takes the various parts of the chat message and pieces it together into an HTML string.
    Object.keys(data.message.message).forEach((key) => {
        let message = data.message.message[key],
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

    // If chat message is a /me then set variable to italic so the chat message gets that class.
    if (data.message.meta.me === true) {
        me = "italic";
    }

    // If chat message is a whisper then let's give it a whisper class.
    if (data.message.meta.whisper === true) {
        whisper = "whisper";
    }

    // This is the final message HTML.
    messageTemplate = `
        <div class="${me} ${whisper} ${data.user_roles[0]}" messageId="${data.id}">
            <div class="chatLeft">
                <div class="chatUserAvatar">
                    <img src="${data.user_avatar}">
                </div>
            </div>
            <div class="chatRight">
                <div class="chatUsername">
                    <a href="https://mixer.com/${data.user_name}">${data.user_name}</a>
                </div>
                <div class="chatContent">
                    ${messageHTML}
                </div>
            </div>
        </div>
    `;

    // Push HTML string to chat packet.
    data.messageHTML = messageTemplate;

    // Send completed packet to UI.
    renderWindow.webContents.send('chatMessage', data);
}

// Export Functions
exports.send = textProcessor;
exports.parseArg = parseArg;
exports.uiChatMessage = uiChatMessage;