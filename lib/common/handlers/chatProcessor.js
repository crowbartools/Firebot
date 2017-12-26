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

// Export Functions
exports.send = textProcessor;
exports.parseArg = parseArg;