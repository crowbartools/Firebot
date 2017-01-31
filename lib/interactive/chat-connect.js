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
    streamerConnect();
    botConnect();
}

// Streamer Chat Connect 
// This checks to see if the streamer is logged into the app, and if so it will connect them to chat.
function streamerConnect(){
    // Get streamer data.
    try{
        var chatter = dbAuth.getData('/streamer');

        // Save this info so we know how to chat later.
        dbSettings.push('/chat/streamer', true);
    }catch(err){
        errorLog.log('You need to to log into the app as a streamer. (chat-connect)');

        // Save info so we know how to chat later.
        dbSettings.push('/chat/streamer', false);

        return;
    }

    // Bot Login
    beam.use('oauth', {
        clientId: "f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9",
        tokens: {
            access: chatter.token,
            expires: Date.now() + 365 * 24 * 60 * 60 * 1000
        }
    })

    beam.request('GET', `chats/`+chatter['channelID']).then(response => {
        var body = response.body;
        createBotChatSocket("Streamer", chatter['userID'], chatter['channelID'], body.endpoints, body.authkey);
    })
    .catch(error => {
        // Popup error.
        errorLog.log('Couldnt connect to chat as streamer. (chat-connect)')
        // Send error message to gui
        renderWindow.webContents.send('chat-disconnect');
        console.log('Something went wrong:', error);
    });
}

// Bot Chat Connect
// This checks to see if bot info is available, and if so it will connect them to chat.
function botConnect(){
    // Get bot data.
    try{
        var chatter = dbAuth.getData('/bot');

        // Save this info so we know how to chat later.
        dbSettings.push('/chat/bot', true);
    }catch(err){
        var chatter = false;

        // Save info so we know how to chat later.
        dbSettings.push('/chat/bot', false);
    }

    // Get streamer data so we know what channel to connect to.
    try{
        var streamer = dbAuth.getData('/streamer');
    }catch(err){
        errorLog.log('You need to to log into the app as a streamer. (chat-connect)')
        return;
    }

    // Bot Login
    if (chatter !== false){
        beam.use('oauth', {
            clientId: "f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9",
            tokens: {
                access: chatter.token,
                expires: Date.now() + 365 * 24 * 60 * 60 * 1000
            }
        })

        beam.request('GET', `chats/`+streamer['channelID']).then(response => {
            var body = response.body;
            createBotChatSocket("Bot", chatter['userID'], streamer['channelID'], body.endpoints, body.authkey);
        })
        .catch(error => {
            // Popup error.
            errorLog.log('Couldnt connect to chat as streamer. (chat-connect)')
            // Send error message to gui
            renderWindow.webContents.send('chat-disconnect');
            console.log('Something went wrong:', error);
        });
    } else {
        console.log('There is no bot signed in. Skipping bot chat connect.')
    }
}


// Creates the chat websocket
// This sets up and auths with the chat websocket.
function createBotChatSocket (chatter, userId, channelId, endpoints, authkey) {

    // Setup chat socket related to the chatter (bot or streamer).
    if(chatter == "Streamer"){
        // Chat connection
        global.streamerChat = new BeamSocket(endpoints).boot();

        // React to chat messages
        global.streamerChat.on('ChatMessage', data => {
            if (data.message.message[0].data.toLowerCase().startsWith('!ping')) {
                // You can do fun stuff here to auto respond to certain commands.
            }
        });

        // Handle errors
        global.streamerChat.on('error', error => {
            // Popup error.
            errorLog.log('There was an error with the chat socket for '+chatter+'. (chat-connect)')
            // Send error message to gui
            renderWindow.webContents.send('chat-disconnect');
            console.error('Socket error', error);
        });

        return global.streamerChat.auth(channelId, userId, authkey)
        .then(() => {
            console.log('Logged into chat as '+chatter+'.');

            // Update chat status
            dbSettings.push('/chat/chatStatus', true);
        });
    } else {
        // Chat connection
        global.botChat = new BeamSocket(endpoints).boot();

        // React to chat messages
        global.botChat.on('ChatMessage', data => {
            if (data.message.message[0].data.toLowerCase().startsWith('!ping')) {
                // You can do fun stuff here to auto respond to certain commands.
            }
        });

        // Handle errors
        global.botChat.on('error', error => {
            // Popup error.
            errorLog.log('There was an error with the chat socket for '+chatter+'. (chat-connect)')
            // Send error message to gui
            renderWindow.webContents.send('chat-disconnect');
            console.error('Socket error', error);
        });

        return global.botChat.auth(channelId, userId, authkey)
        .then(() => {
            console.log('Logged into chat as '+chatter+'.');

            // Update chat status
            dbSettings.push('/chat/chatStatus', true);
        });
    }
}

// Disconnect from chat
// This should gracefully disconnect from chat.
function chatDisconnect(){
    global.streamerChat.close();
    global.botChat.close();

    // Update chat status
    dbSettings.push('/chat/chatStatus', false);
}

// Whisper
// Send a whisper to a specific person from whoever the chatter is (streamer or bot).
function whisper(chatter, username, message){
     if (chatter == "Streamer"){
        try{
            global.streamerChat.call('whisper', [username, message]);
            console.log('Sent message as '+chatter+'.')
        }catch(err){
            errorLog.log('There was an error sending your message from '+chatter+'. (chat-connect)');
        }
     } else if (chatter == "Bot") {
        try{
            global.botChat.call('whisper', [username, message]);
            console.log('Sent message as '+chatter+'.')
        }catch(err){
            errorLog.log('There was an error sending your message from '+chatter+'. (chat-connect)');
        }
     }	 
}

// Broadcast
// Send a broadcast to the channel from whoever the chatter is (streamer or bot).
function broadcast(chatter, message){
    if(chatter == "Streamer"){
        try{
            global.streamerChat.call('msg', [message]);
            console.log('Sent message as '+chatter+'.')
        } catch(err){
            errorLog.log('There was an error sending your message from '+chatter+'. (chat-connect)');
        }
    } else if (chatter == "Bot"){
        try{
            global.botChat.call('msg', [message]);
            console.log('Sent message as '+chatter+'.')
        } catch(err){
            errorLog.log('There was an error sending your message from '+chatter+'. (chat-connect)');
        }
    }
}


// Export Functions
exports.connect = chatConnect;
exports.disconnect = chatDisconnect;
exports.whisper = whisper;
exports.broadcast = broadcast;