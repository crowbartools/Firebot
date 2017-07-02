const JsonDB = require('node-json-db');
const chat = require('../mixer-chat.js');

function textProcessor(effect, participant){

    try{
        // Get user specific settings
        var message = effect.message;
        var chatter = effect.chatter;
        var whisper = effect.whisper;
        var username = participant.username;

        // Replace 'user' varibles with username
        if(message != null) {
          message = message.replace('$(user)', username);
        }

        // Send off the chat packet.
        if(whisper != null && whisper !== ""){
            // Send a whisper
            whisper = whisper.replace('$(user)', username);
                    
            console.log('sending text', chatter, whisper, message);
            chat.whisper(chatter, whisper, message);
        } else {
            // Send a broadcast
            console.log('sending broadcast', chatter, message);
            chat.broadcast(chatter, message);
        }
    }catch(err){
        renderWindow.webContents.send('error', "There was an error sending a chat message.");
        console.log(err);
    }
}


// Export Functions
exports.send = textProcessor;