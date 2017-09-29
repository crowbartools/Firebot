const mixerClient = require('beam-client-node');
const mixerSocket = require('beam-client-node/lib/ws');
const mixer = new mixerClient();
const dataAccess = require('./data-access.js');
const {ipcMain, BrowserWindow} = require('electron');

const commandRouter = require("../chat/command-router.js");
const timedCommands = require("../chat/timed-commands.js");

// Options
var options = {
    client_id: 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9'
};

// Chat Connector
// This function connects to mixer chat and monitors messages.
function chatConnect(){
    return new Promise((resolve, reject) => {
        var dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");

        var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");

        // Get streamer data.
        try{
            var streamer = dbAuth.getData('/streamer');
            streamerConnect(streamer);
        }catch(err){
            renderWindow.webContents.send('error', "You need to sign into the app as a streamer to connect to chat.");
            reject(err);
            return;
        }

        // Get bot data.
        try{
            var botter = dbAuth.getData('/bot');
            botConnect(botter);
        }catch(err){
            console.log('No bot logged in. Skipping. (chat-connect)');
            return;
        }

        resolve(true);
    })
}

// Streamer Chat Connect
// This checks to see if the streamer is logged into the app, and if so it will connect them to chat.
function streamerConnect(streamer){
    // Bot Login
    mixer.use('oauth', {
        clientId: options.client_id,
        tokens: {
            access: streamer.accessToken,
            expires: Date.now() + 365 * 24 * 60 * 60 * 1000
        }
    })

    // Request chat endpoints and connect.
    mixer.request('GET', `chats/`+streamer['channelId']).then(response => {
        var body = response.body;
        createChatSocket("Streamer", streamer['userId'], streamer['channelId'], body.endpoints, body.authkey);

        // Start timed command loop.
        timedCommands.timedCmdLoop(true);

        // Update streamer name for chat permissions.
        commandRouter.updateStreamerUsername();

        // Set connection status to online
        renderWindow.webContents.send('chatConnection', "Online");

    })
    .catch(error => {
        // Popup error.
        renderWindow.webContents.send('error', "Couldnt connect to chat as the streamer.");

        // Set connection status to offline
        renderWindow.webContents.send('chatConnection', "Offline");

        // Log error for dev.
        console.log('Something went wrong:', error);
    });
}

// Bot Chat Connect
// This checks to see if bot info is available, and if so it will connect them to chat.
function botConnect(botter){
    var dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");

    // Get streamer data so we can get the channel id to connect to.
    try{
        var streamer = dbAuth.getData('/streamer');

        // Bot Login
        mixer.use('oauth', {
            clientId: options.client_id,
            tokens: {
                access: botter.accessToken,
                expires: Date.now() + 365 * 24 * 60 * 60 * 1000
            }
        })

        // Request endpoints and connect.
        mixer.request('GET', `chats/`+streamer['channelId']).then(response => {
            var body = response.body;
            createChatSocket("Bot", botter['userId'], streamer['channelId'], body.endpoints, body.authkey);
        })
        .catch(error => {
            // Popup error.
            renderWindow.webContents.send('error', "I couldnt connect to the chat as your bot account.");

            // Log errors for dev.
            console.log('Something went wrong:', error);
        });
    }catch(err){
        renderWindow.webContents.send('error', "You need to sign into the app as a streamer to connect to chat.");
        return;
    }
}


// Creates the chat websocket
// This sets up and auths with the chat websocket.
function createChatSocket (chatter, userId, channelId, endpoints, authkey) {
    var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");

    // This gets the current interactive info and caches it for chat to pass to the effects handler later.
    var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
    var gameName = dbSettings.getData('/interactive/lastBoard');
    var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);
    var firebot = dbControls.getData('/firebot');

    // Setup chat socket related to the chatter (bot or streamer).
    if(chatter == "Streamer"){
        // Chat connection
        global.streamerChat = new mixerSocket(endpoints).boot();

        // React to chat messages
        global.streamerChat.on('ChatMessage', data => {
          
          var message = data.message.message[0].data;
          if(commandRouter.messageIsCommand(message)) {
            commandRouter.handleChatCommand(data, 'streamer', firebot);
          }
        });

        // Handle errors
        global.streamerChat.on('error', error => {
            // Popup error.
            renderWindow.webContents.send('error', "There was an error with streamer chat or it was disconnected.");

            // Log for dev.
            console.error('Socket error (streamer)', error);

            // Set connection status to offline
            renderWindow.webContents.send('chatConnection', "Offline");
        });

        // Confirm login.
        return global.streamerChat.auth(channelId, userId, authkey)
        .then(() => {
            console.log('Logged into chat as '+chatter+'.');
        });
    } else {
        // Chat connection
        global.botChat = new mixerSocket(endpoints).boot();

        // React to chat messages
        global.botChat.on('ChatMessage', data => {
          
          var message = data.message.message[0].data;
          if(commandRouter.messageIsCommand(message)) {
            commandRouter.handleChatCommand(data, 'bot', firebot);
          }
          
        });

        // Handle errors
        global.botChat.on('error', error => {
            // Popup error.
            renderWindow.webContents.send('error', "There was an error with bot chat or it was disconnected.");

            // Send error message to gui
            renderWindow.webContents.send('chat-disconnect');

            // Log for dev.
            console.error('Socket error (bot)', error);

            // Set connection status to offline
            renderWindow.webContents.send('chatConnection', "Offline");
        });

        // Confirm connection.
        return global.botChat.auth(channelId, userId, authkey)
        .then(() => {
            console.log('Logged into chat as '+chatter+'.');
        });
    }
}

// Disconnect from chat
// This should gracefully disconnect from chat.
function chatDisconnect(){
    if (global.streamerChat !== undefined){
        console.log('Disconnecting streamer chat.');
        global.streamerChat.close();

        // Stop timed command loop.
        timedCommands.timedCmdLoop(false);
    }
    if(global.botChat !== undefined){
        console.log('Disconnecting bot chat.');
        global.botChat.close();
    }

    // Set connection status to offline
    renderWindow.webContents.send('chatConnection', "Offline");
}

// Whisper
// Send a whisper to a specific person from whoever the chatter is (streamer or bot).
function whisper(chatter, username, message){
    // Normalize the chatter type
    chatter = chatter.toLowerCase();
     if (chatter == "streamer"){
        try{
            global.streamerChat.call('whisper', [username, message]);
            console.log('Sent message as '+chatter+'.')
        }catch(err){
            renderWindow.webContents.send('error', "There was an error sending a whisper to chat as the streamer. If you are testing a chat button, please make sure Interactive is connected.");
        }
     } else if (chatter == "bot") {
        try{
            global.botChat.call('whisper', [username, message]);
            console.log('Sent message as '+chatter+'.')
        }catch(err){
            renderWindow.webContents.send('error', "There was an error sending a whisper to chat as the bot. If you are testing a chat button, please make sure Interactive is connected.");
        }
     }
}

// Broadcast
// Send a broadcast to the channel from whoever the chatter is (streamer or bot).
function broadcast(chatter, message){
    // Normalize the chatter type
    chatter = chatter.toLowerCase();
    if(chatter == "streamer"){
        try{
            global.streamerChat.call('msg', [message]);
            console.log('Sent message as '+chatter+'.')
        } catch(err){
            renderWindow.webContents.send('error', "There was an error sending a message to chat as the streamer. If you are testing a chat button, please make sure Interactive is connected.");
        }
    } else if (chatter == "bot"){
        try{
            global.botChat.call('msg', [message]);
            console.log('Sent message as '+chatter+'.')
        } catch(err){
            renderWindow.webContents.send('error', "There was an error sending a message to chat as the bot. If you are testing a chat button, please make sure Interactive is connected.");
        }
    }
}

// Get User Info
// This grabs the user info of a person in chat.
function getChatUserInfo(userID, callback){
    var dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");
    var streamer = dbAuth.getData('/streamer');

    // Request User Info and return response.
    mixer.request('GET', `chats/`+streamer['channelId']+'/users/'+userID).then(response => {
        callback(response);
    })
    .catch(error => {
        // Log error for dev.
        console.log('Something went wrong when trying to get use info from chat api.', error);
    });
}

// This deletes a chat message by id.
function deleteChatMessage(id) {
    global.streamerChat.call('deleteMessage', [id]);
}

// Auth Process
// This kicks off the login process once refresh tokens are recieved.
ipcMain.on('gotChatRefreshToken', function(event, status) {
    chatConnect();
});

// Chat Toggle
// Controls Turning on and off chat when connection button is pressed.
ipcMain.on('mixerChat', function(event, status) {
    if(status == "connect" || status == "connected"){
        // Do nothing as this is handled by the "gotRefreshToken" auth process.
    } else {
        // Kill connection.
        chatDisconnect();
    }
});

// Export Functions
exports.connect = chatConnect;
exports.disconnect = chatDisconnect;
exports.whisper = whisper;
exports.broadcast = broadcast;
exports.getUser = getChatUserInfo;
exports.deleteChat = deleteChatMessage;
