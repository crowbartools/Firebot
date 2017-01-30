const BeamClient = require('beam-client-node');
const BeamSocket = require('beam-client-node/lib/ws');
const beam = new BeamClient();
const JsonDB = require('node-json-db');
const {ipcMain, BrowserWindow} = require('electron');

const errorLog = require('../error-logging/error-logging.js')

// DBs
const dbAuth = new JsonDB("./user-settings/auth", true, false);
const dbSettings = new JsonDB('./user-settings/settings', true, false);

// Chat Connector
// This function connects to beam chat and monitors messages.
function chatConnect(){

    // Get streamer data.
    try{
        var streamer = dbAuth.getData('/streamer');
    }catch(err){
        errorLog.log('You need to to log into the app as a streamer. (chat-connect)');
        return;
    }

    // See if bot info is available.
    try{
        // It is! So we'll chat as the bot.
        var chatter = dbAuth.getData('/bot');
        
        // Save this info so we know how to chat later.
        dbSettings.push('/chat/chatter', "bot");
    }catch(err){
        // It isn't so just chat as the streamer.
        var chatter = streamer;

        // Save this info so we know how to chat later.
        dbSettings.push('/chat/chatter', "streamer");
    }

    // Bot Login
    beam.use('oauth', {
        clientId: "f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9",
        tokens: {
            access: chatter.token,
            expires: Date.now() + 365 * 24 * 60 * 60 * 1000
        }
    })

    beam.request('GET', `chats/`+streamer['channelID']).then(response => {
        var body = response.body;
        createBotChatSocket(chatter['userID'], streamer['channelID'], body.endpoints, body.authkey);
    })
    .catch(error => {
        // Popup error.
        errorLog.log('Couldnt connect to chat. (chat-connect)')
        // Send error message to gui
        renderWindow.webContents.send('chat-disconnect');
        console.log('Something went wrong:', error);
    });
}

// Creates the chat websocket
// This sets up and auths with the chat websocket.
function createBotChatSocket (userId, channelId, endpoints, authkey) {
    
    // Chat connection
    global.chat = new BeamSocket(endpoints).boot();

    // React to chat messages
    global.chat.on('ChatMessage', data => {
        if (data.message.message[0].data.toLowerCase().startsWith('!ping')) {
            // You can do fun stuff here to auto respond to certain commands.
        }
    });

    // Handle errors
    global.chat.on('error', error => {
        // Popup error.
        errorLog.log('There was an error with the chat socket. (chat-connect)')
        // Send error message to gui
        renderWindow.webContents.send('chat-disconnect');
        console.error('Socket error', error);
    });

    return global.chat.auth(channelId, userId, authkey)
    .then(() => {
        console.log('Logged into chat as '+userId+'.');

        // Update chat status
        dbSettings.push('/chat/chatStatus', true);
    });
}

// Disconnect from chat
// This should gracefully disconnect from chat.
function chatDisconnect(){
    global.chat.close();

    // Update chat status
    dbSettings.push('/chat/chatStatus', false);
}

// Send Whisper to a specific person.
function whisper(username, message){
	 global.chat.call('whisper', [username, message]);
}

// Send Broadcast to everyone in chat.
function broadcast(message){
	global.chat.call('msg', [message]);
}




// Export Functions
exports.connect = chatConnect;
exports.disconnect = chatDisconnect;
exports.whisper = whisper;
exports.broadcast = broadcast;