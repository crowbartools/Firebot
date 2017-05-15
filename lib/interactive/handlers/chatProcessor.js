const JsonDB = require('node-json-db');
const chat = require('../beam-chat.js');

function textProcessor(effect){

    // Get user specific settings
    var message = effect.message;
    var chatter = effect.chatter;
    var whisper = effect.whisper;

    if(whisper !== "" && whisper !== undefined && whisper !== null){
        // Send a whisper
        console.log('sending text', chatter, whisper, message);
        chat.whisper(chatter, whisper, message);
    } else {
        // Send a broadcast
        console.log('sending broadcast', chatter, message);
        chat.broadcast(chatter, message);
    }

}


// Export Functions
exports.send = textProcessor;