const JsonDB = require('node-json-db');
const chat = require('../beam-chat.js');

function textProcessor(effect, participant){

    try{
        // Get user specific settings
        var message = effect.message;
        var chatter = effect.chatter;
        var whisper = effect.whisper;
        var username = participant.username;

        // If there is a username variable in the message or whisper then replace it with username.
        var message = message.replace('$(user)', username);
        var whisper = whisper.replace('$(user)', username);

        // Send off the chat packet.
        if(whisper !== "" && whisper !== undefined && whisper !== null){
            // Send a whisper
            console.log('sending text', chatter, whisper, message);
            chat.whisper(chatter, whisper, message);
        } else {
            // Send a broadcast
            console.log('sending broadcast', chatter, message);
            chat.broadcast(chatter, message);
        }
    }catch(err){
        renderWindow.webContents.send('error', "There was an error sending a chat message.");
    }
}


// Export Functions
exports.send = textProcessor;