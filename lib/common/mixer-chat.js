const mixerInteractive = require('./mixer-interactive.js');
const mixerClient = require('beam-client-node');
const mixerSocket = require('beam-client-node/lib/ws');
const mixer = new mixerClient();
const dataAccess = require('./data-access.js');
const {ipcMain, BrowserWindow} = require('electron');
const Grouper = require('../interactive/auto-grouper');
const commandRouter = require("../chat/command-router.js");
const timedCommands = require("../chat/timed-commands.js");

// Options
var options = {
    client_id: 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9'
};

// This holds the connection status of chat.
var chatConnected = false;

// Holds a cache of all commands.
var commandCache = [];
refreshCommandCache();

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

        // Set chat connection to online.
        chatConnected = true;

        // Start auto grouper if both chat and interactive connected.
        // This auto groups people for interactive groups and depends on chat being connected.
        Grouper.startQueue();

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

    // This gets the current interactive info for chat to pass to the effects handler later.
    var interactiveCache = mixerInteractive.getInteractiveCache();
    var interactiveCache = interactiveCache['firebot'];

    // This refreshes the commands cache.
    refreshCommandCache();

    // Setup chat socket related to the chatter (bot or streamer).
    if(chatter == "Streamer"){
        // Chat connection
        global.streamerChat = new mixerSocket(endpoints).boot();

        // React to chat messages
        global.streamerChat.on('ChatMessage', data => {
          
          var message = data.message.message[0].data;
          if(commandRouter.messageIsCommand(message)) {
            commandRouter.handleChatCommand(data, 'streamer', interactiveCache, commandCache);
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

            // Set chat connection to offline.
            chatConnected = false;
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
            commandRouter.handleChatCommand(data, 'bot', interactiveCache, commandCache);
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

    // Set chat connection to offline.
    chatConnected = false;
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

// Get connection status
function getChatStatus(){
    return chatConnected;
}

// Refreshes the commands cache
function refreshCommandCache(retry){

    // FB: I've set a weird retry thing here because I ran into a rare issue where upon saving settings the app tried to
    // save and get the same file at the same time which threw errors and caused the cache to get out
    // of sync.
    if (retry != null){
        var retry = retry;
    } else {
        var retry = 1;
    }

    // Get commands file
    try{
        var dbCommands = dataAccess.getJsonDbInUserData("/user-settings/chat/commands");
    }catch(err){
        // This would mean we couldn't find any commands. So, we can stop trying to refresh the cache.
        return;
    }

    // We've got the last used board! Let's update the interactive cache.
    if(dbCommands != null){
        if(retry <= 3){
            try{
                // Get settings for last board.
                var commands = dbCommands.getData('/');

                commandCache = commands;
                console.log('Updated Command cache.');
            }catch(err){
                console.log('Command cache update failed. Retrying. (Try '+retry+'/3)');
                var retry = retry + 1;
                refreshCommandCache(retry);
            }
        } else {
            renderWindow.webContents.send('error', "Could not sync up command cache. Reconnect to try resyncing.");
        }
    }
}

// Get command cache
function getCommandCache(){
    return commandCache;
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

// Refresh Command Cache
// Refreshes backend command cache
ipcMain.on('refreshCommandCache', function(event, status) {
    refreshCommandCache();
});

// Export Functions
exports.connect = chatConnect;
exports.disconnect = chatDisconnect;
exports.whisper = whisper;
exports.broadcast = broadcast;
exports.getUser = getChatUserInfo;
exports.deleteChat = deleteChatMessage;
exports.getChatStatus = getChatStatus;
exports.getCommandCache = getCommandCache;
exports.refreshCommandCache = refreshCommandCache;