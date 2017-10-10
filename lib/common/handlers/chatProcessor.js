const chat = require('../mixer-chat.js');

function textProcessor(effect, participant, control, userCommand){

    try{
        // Get user specific settings
        console.log(userCommand);
        var message = effect.message;
        var chatter = effect.chatter;
        var whisper = effect.whisper;
        var username = participant.username;
        var controlText = control.text;
        var controlCost = control.cost;
        var controlCooldown = control.cooldown;

        // Arguments
        if( userCommand != null && message.includes("$(arg") ){
            var userArg = parseArg(message);
            for (arg in userArg){
                var arrayNum = userArg[arg] - 1;
                var argNum = userArg[arg];
                console.log(argNum);
                message = message.replace('$(arg'+argNum+')', userCommand.args[arrayNum]);
            }
        }

        // Replace 'user' varibles with username
        if(message != null) {
          message = message.replace('$(user)', username);
          message = message.replace('$(text)', controlText);
          message = message.replace('$(cost)', controlCost);
          message = message.replace('$(cooldown)', controlCooldown);
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
        renderWindow.webContents.send('error', "There was an error sending a chat message. If you are testing a chat button, please make sure Interactive is connected.");
        console.log(err);
    }
}

// This will parse the message string and build an array of Arg numbers the user wants to use.
function parseArg(str) {
    var index = [];
    var newTxt = str.split('(');
    for (var i = 1; i < newTxt.length; i++) {
        var text = newTxt[i].split(')')[0];

        // This will strip the argument down to the specific number.
        if( text.includes('arg') ){
            // Replace "arg" with nothing.
            var text = text.replace('arg','');
            index.push( parseInt(text) );
        }
    }
    return index;
}


// Export Functions
exports.send = textProcessor;