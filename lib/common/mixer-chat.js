'use strict';

const request = require('request');
const mixerInteractive = require('./mixer-interactive.js');
const Mixer = require('beam-client-node');
const ws = require('ws');
const dataAccess = require('./data-access.js');
const {ipcMain} = require('electron');
const Grouper = require('../interactive/auto-grouper');
const commandRouter = require("../chat/command-router.js");
const timedCommands = require("../chat/timed-commands.js");
const chatProcessor = require("../common/handlers/chatProcessor.js");
const controlPermissions = require("../interactive/permissions.js");
const mixerConstellation = require('../live-events/mixer-constellation.js');

const streamerClient = new Mixer.Client(new Mixer.DefaultRequestRunner());
const botClient = new Mixer.Client(new Mixer.DefaultRequestRunner());

// Options
let options = {
    cliendId: 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9'
};

// This holds the connection status of chat.
let chatConnected = false;

// Chat Reconnection
let chatReconnecting = false;
let chatReconnectTimeout = false;

// Holds a cache of all commands.
let commandCache = [];

// Refreshes the commands cache
function refreshCommandCache(retry) {

    // FB: I've set a weird retry thing here because I ran into a rare issue where upon saving settings the app tried to
    // save and get the same file at the same time which threw errors and caused the cache to get out
    // of sync.
    if (retry === null || retry === undefined) {
        retry = 1;
    }

    // Get commands file
    let dbCommands = dataAccess.getJsonDbInUserData("/user-settings/chat/commands");
    if (dbCommands === undefined || dbCommands === null) return;

    // We've got the last used board! Let's update the interactive cache.
    if (dbCommands != null) {
        if (retry <= 3) {
            try {
                // Get settings for last board.
                let commands = dbCommands.getData('/');

                commandCache = commands;
                console.log('Updated Command cache.');
            } catch (err) {
                console.log('Command cache update failed. Retrying. (Try ' + retry + '/3)');
                retry = retry + 1;
                refreshCommandCache(retry);
            }
        } else {
            renderWindow.webContents.send('error', "Could not sync up command cache. Reconnect to try resyncing.");
        }
    }
}

refreshCommandCache();

// Chat Reconnect
// This will attempt to reconnect to chat.
function chatReconnect(retry, override) {
    console.log('Starting reconnect function.');
    if (chatReconnecting && !override) return;

    chatReconnecting = true;
    let retryWait = 5000;
    let maxRetries = 5;
    let newRetry = retry + 1;

    if (!chatConnected && retry <= maxRetries) {
        // Trying to reconnect...
        console.log('Chat reconnect try: ' + newRetry + '/' + maxRetries);

        // Disconnect everything if we need to.
        // eslint-disable-next-line no-use-before-define
        chatDisconnect();

        chatReconnectTimeout = setTimeout(function(nextRetry) {
            if (!chatConnected) {
                // eslint-disable-next-line no-use-before-define
                chatConnect();
                chatReconnect(nextRetry, true);
            }
        }, newRetry * retryWait, newRetry);

    } else if (!chatConnected && retry > maxRetries) {
        // We failed to connect a bunch of times!
        renderWindow.webContents.send('error', "Chat reconnection failed several times. Stopping reconnection attempts.");

        // Clear constellation subscriptions.
        // This is here so that next time chat connects we have a clean slate.
        mixerConstellation.disconnect();

        // Clear Timeout
        clearTimeout(chatReconnectTimeout);
        chatReconnecting = false;
    } else {
        // We connected!
        // Clear Timeout
        clearTimeout(chatReconnectTimeout);
        chatReconnecting = false;
    }
}

// Creates the chat websocket
// This sets up and auths with the chat websocket.
function createChatSocket (chatter, userId, channelId, endpoints, authkey) {

    // Refresh all caches.
    refreshCommandCache();
    mixerInteractive.refreshInteractiveCache();

    // Get controls to send on.
    let interactiveCache = mixerInteractive.getInteractiveCache();
    interactiveCache = interactiveCache['firebot'];

    // Setup chat socket related to the chatter (bot or streamer).
    if (chatter === "Streamer") {
        const socket = new Mixer.Socket(ws, endpoints).boot();

        // React to chat messages
        socket.on('ChatMessage', data => {
            // Send to command router to see if we need to act on a command.
            commandRouter.handleChatCommand(data, 'streamer', interactiveCache, commandCache);

            // Send to UI to show in chat window.
            chatProcessor.uiChatMessage(data);
        });

        // User joined the channel
        socket.on('UserJoin', data => {
            data.fbEvent = 'UserJoin';
            renderWindow.webContents.send('chatUpdate', data);
        });

        // User left the channel.
        socket.on('UserLeave', data => {
            data.fbEvent = 'UserLeave';
            renderWindow.webContents.send('chatUpdate', data);
        });

        // Poll Started
        socket.on('PollStart', data => {
            data.fbEvent = 'PollStart';
            renderWindow.webContents.send('chatUpdate', data);
        });

        // Poll End
        socket.on('PollEnd', data => {
            data.fbEvent = 'PollEnd';
            renderWindow.webContents.send('chatUpdate', data);
        });

        // Deleted Message
        socket.on('DeleteMessage', data => {
            data.fbEvent = 'DeleteMessage';
            renderWindow.webContents.send('chatUpdate', data);
        });

        // Purge Message
        // Provides a moderator object if messages purged due to a ban.
        socket.on('PurgeMessage', data => {
            data.fbEvent = 'PurgeMessage';
            renderWindow.webContents.send('chatUpdate', data);
        });

        // Clear Messages
        socket.on('ClearMessages', data => {
            data.fbEvent = 'ClearMessages';
            renderWindow.webContents.send('chatUpdate', data);
        });

        // User Update
        // Bans, subscribes, modding, etc...
        socket.on('UserUpdate', data => {
            data.fbEvent = 'UserUpdate';
            renderWindow.webContents.send('chatUpdate', data);
        });

        // User Timeout
        socket.on('UserTimeout', data => {
            data.fbEvent = 'UserTimeout';
            renderWindow.webContents.send('chatUpdate', data);
        });

        // Handle errors
        socket.on('error', error => {
            // Log for dev.
            console.error('Socket error (streamer)');
            console.log(error);

            // Set connection status to offline
            renderWindow.webContents.send('chatConnection', "Offline");

            // Set chat connection to offline.
            chatConnected = false;

            // Clear constellation subscriptions.
            // This is here so that next time chat connects we have a clean slate.
            mixerConstellation.disconnect();

            // Clear current chat messages and display alert message. It will resync them all on reconnect.
            renderWindow.webContents.send('chatUpdate', {fbEvent: "Disconnected"});

            // Try to reconnect
            chatReconnect(0, false);
        });

        // Confirm login.
        return socket.auth(channelId, userId, authkey)
            .then(() => {
                global.streamerChat = socket;
                console.log('Logged into chat as ' + chatter + '.');
            });
    } else if (chatter === "Bot") {
    // Chat connection
        const socket = new Mixer.Socket(ws, endpoints).boot();

        // React to chat messages
        socket.on('ChatMessage', data => {
            commandRouter.handleChatCommand(data, 'bot', interactiveCache, commandCache);
        });

        // Handle errors
        socket.on('error', error => {
            // Log for dev.
            console.error('Socket error (bot)');
            console.log(error);

            // Set connection status to offline
            renderWindow.webContents.send('chatConnection', "Offline");

            // Set chat connection to offline.
            chatConnected = false;

            // Clear constellation subscriptions.
            // This is here so that next time chat connects we have a clean slate.
            mixerConstellation.disconnect();

            // Try to reconnect
            chatReconnect(0, false);
        });

        // Confirm connection.
        return socket.auth(channelId, userId, authkey)
            .then(() => {
                global.botChat = socket;
                console.log('Logged into chat as ' + chatter + '.');
            });
    }
}

// Disconnect from chat
// This should gracefully disconnect from chat.
function chatDisconnect() {
    if (global.streamerChat !== undefined) {
        console.log('Disconnecting streamer chat.');
        global.streamerChat.close();

        // Stop timed command loop.
        timedCommands.timedCmdLoop(false);

        // Stop Constellation
        mixerConstellation.disconnect();
    }
    if (global.botChat !== undefined) {
        console.log('Disconnecting bot chat.');
        global.botChat.close();
    }

    // Set connection status to offline
    renderWindow.webContents.send('chatConnection', "Offline");

    // Set chat connection to offline.
    chatConnected = false;
}

// Streamer Chat Connect
// This checks to see if the streamer is logged into the app, and if so it will connect them to chat.
function streamerConnect(streamer) {
    let userInfo;

    // Bot Login
    streamerClient.use(new Mixer.OAuthProvider(streamerClient, {
        clientId: options.cliendId,
        tokens: {
            access: streamer.accessToken,
            expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
        }
    }));

    // Request chat endpoints and connect.
    streamerClient.request('GET', `users/` + streamer['userId'])
        .then(response => {
            userInfo = response.body;
            return new Mixer.ChatService(streamerClient).join(response.body.channel.id);
        })
        .then(response => {
            const body = response.body;
            createChatSocket("Streamer", userInfo.id, userInfo.channel.id, body.endpoints, body.authkey);
        })
        .then(() => {
            // Start timed command loop.
            timedCommands.timedCmdLoop(true);

            // Update streamer name for chat permissions.
            commandRouter.updateStreamerUsername();

            // Update streamer name for control permissions;
            controlPermissions.updateStreamerUsername();

            // Set connection status to online
            renderWindow.webContents.send('chatConnection', "Online");

            // Set chat connection to online.
            chatConnected = true;

            // Start auto grouper if both chat and interactive connected.
            // This auto groups people for interactive groups and depends on chat being connected.
            Grouper.startQueue();

            // Get chat history and send it to ui.
            chatProcessor.uiGetChatHistory(streamerClient);

            // Get chat user list and send it to ui.
            chatProcessor.uiChatUserRefresh(0, []);
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
function botConnect(botter) {
    let userInfo,
        dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth"),
        streamer = dbAuth.getData('/streamer');

    // Bot Login
    botClient.use(new Mixer.OAuthProvider(botClient, {
        clientId: options.cliendId,
        tokens: {
            access: botter.accessToken,
            expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
        }
    }));

    // Request chat endpoints and connect.
    botClient.request('GET', `users/` + botter['userId'])
        .then(response => {
            userInfo = response.body;
            return new Mixer.ChatService(botClient).join(streamer['channelId']);
        })
        .then(response => {
            const body = response.body;
            createChatSocket("Bot", userInfo.id, streamer['channelId'], body.endpoints, body.authkey);
        })
        .catch(error => {
            // Popup error.
            renderWindow.webContents.send('error', "Couldnt connect to chat as the bot.");

            // Set connection status to offline
            renderWindow.webContents.send('chatConnection', "Offline");

            // Log error for dev.
            console.log('Something went wrong:', error);
        });
}

// Chat Connector
// This function connects to mixer chat and monitors messages.
function chatConnect() {
    return new Promise((resolve, reject) => {
        let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");

        // Get streamer data.
        try {
            let streamer = dbAuth.getData('/streamer');
            streamerConnect(streamer);

            // Connect to constellation as well for live events.
            mixerConstellation.connect(streamer['channelId']);
        } catch (err) {
            renderWindow.webContents.send('error', "You need to sign into the app as a streamer to connect to chat.");
            console.log(err);
            reject(err);
            return;
        }

        // Get bot data.
        try {
            let botter = dbAuth.getData('/bot');
            botConnect(botter);
        } catch (err) {
            console.log(err);
            console.log('No bot logged in. Skipping. (chat-connect)');
            return;
        }

        resolve(true);
    });
}

// Whisper
// Send a whisper to a specific person from whoever the chatter is (streamer or bot).
function whisper(chatter, username, message) {
    // Normalize the chatter type
    chatter = chatter.toLowerCase();
    if (chatter === "streamer") {
        try {
            global.streamerChat.call('whisper', [username, message]);
            console.log('Sent message as ' + chatter + '.');
        } catch (err) {
            renderWindow.webContents.send('error', "There was an error sending a whisper to chat as the streamer. If you are testing a chat button, please make sure Interactive is connected.");
        }
    } else if (chatter === "bot") {
        try {
            global.botChat.call('whisper', [username, message]);
            console.log('Sent message as ' + chatter + '.');
        } catch (err) {
            renderWindow.webContents.send('error', "There was an error sending a whisper to chat as the bot. If you are testing a chat button, please make sure Interactive is connected.");
        }
    }
}

// Broadcast
// Send a broadcast to the channel from whoever the chatter is (streamer or bot).
function broadcast(chatter, message) {
    // Normalize the chatter type
    chatter = chatter.toLowerCase();
    if (chatter === "streamer") {
        try {
            global.streamerChat.call('msg', [message]);
            console.log('Sent message as ' + chatter + '.');
        } catch (err) {
            renderWindow.webContents.send('error', "There was an error sending a message to chat as the streamer. If you are testing a chat button, please make sure Interactive is connected.");
        }
    } else if (chatter === "bot") {
        try {
            global.botChat.call('msg', [message]);
            console.log('Sent message as ' + chatter + '.');
        } catch (err) {
            renderWindow.webContents.send('error', "There was an error sending a message to chat as the bot. If you are testing a chat button, please make sure Interactive is connected.");
        }
    }
}

// Timeout
// Send a timeout request. This will time out a user for X amount of time.
function timeout(chatter, time) {
    global.streamerChat.call('timeout', [chatter, time]);
}

// Delete Message
// This deletes a chat message by id.
function deleteChatMessage(id) {
    global.streamerChat.call('deleteMessage', [id]);
}

// Clear Messages
// This clears all messages in chat.
function clearChatMessages() {
    global.streamerChat.call('clearMessages', []);
}

// Giveaway
// This starts the built in mixer giveaway feature.
function chatGiveaway() {
    global.streamerChat.call('giveaway:start', []);
}

// Purge
// This will purge all messages from a user.
function chatPurge(username) {
    global.streamerChat.call('purge', [username]);
}

// Change User Role
// This will change a user's role.
function changeUserRole(username, role, addOrRemove) {
    if (role === "Mod" || role === "Banned") {
        let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");
        let streamer = dbAuth.getData('/streamer');

        // Request User Info and return response.
        streamerClient.request('GET', 'channels/' + username + '?fields=userId&noCount=1').then(response => {
            response = response.body;

            // Alright, lets set up our options packet.
            let userId = response.userId,
                options = {
                    url: `https://mixer.com/api/v1/channels/` + streamer['channelId'] + '/users/' + userId,
                    method: 'PATCH',
                    headers: {
                        Authorization: 'Bearer ' + streamer['accessToken'],
                        'User-Agent': 'MixerClient/0.13.0 (JavaScript; Node.js v6.5.0)'
                    },
                    json: true,
                    body: {}
                };

            // Are we adding or removing a role?
            if (addOrRemove === "Add") {
                options.body = {
                    "add": [
                        role
                    ]
                };
            } else if (addOrRemove === "Remove") {
                options.body = {
                    "remove": [
                        role
                    ]
                };
            } else {
                console.log('addOrRemove variable can only be set to "Add" or "Remove" for changing roles.');
            }

            // I tried so hard to get this to work with the Mixer client node package, but I don't think it likes PATCH much.
            // So I've gone with a regular request function here instead. - FB.
            request(options, function(err, res) {
                if (res.statusCode === 200) {
                    // Success!
                    // Let's send an appropriate chat alert message.
                    if (addOrRemove === "Add") {
                        if (role === "Mod") {
                            renderWindow.webContents.send('chatUpdate', {fbEvent: "ChatAlert", message: username + " has been modded."});
                        } else if (role === "Banned") {
                            renderWindow.webContents.send('chatUpdate', {fbEvent: "ChatAlert", message: username + " has been banned."});
                        }
                    } else if (addOrRemove === "Remove") {
                        if (role === "Mod") {
                            renderWindow.webContents.send('chatUpdate', {fbEvent: "ChatAlert", message: username + " has been unmodded."});
                        } else if (role === "Banned") {
                            renderWindow.webContents.send('chatUpdate', {fbEvent: "ChatAlert", message: username + " has been unbanned."});
                        }
                    }
                } else {
                    // Error
                    renderWindow.webContents.send('error', "Something went wrong while trying to change roles for this user.");
                    console.log(err);
                }
            });

        })
            .catch(error => {
                // Log error for dev.
                console.log(error);
                renderWindow.webContents.send('error', "Something went wrong while trying to change roles for this user.");
            });
    } else {
        renderWindow.webContents.send('error', "Firebot tried to change someone to an illegal role.");
    }
}

// Get User Info
// This grabs the user info of a person in chat.
function getChatUserInfo(userID, callback) {
    let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");
    let streamer = dbAuth.getData('/streamer');

    // Request User Info and return response.
    streamerClient.request('GET', `chats/` + streamer['channelId'] + '/users/' + userID).then(response => {
        callback(response);
    })
        .catch(error => {
            // Log error for dev.
            console.log('Something went wrong when trying to get user info from chat api.', error);
            callback(null);
        });
}

// Get connection status
function getChatStatus() {
    return chatConnected;
}

// Get command cache
function getCommandCache() {
    return commandCache;
}

// Auth Process
// This kicks off the login process once refresh tokens are recieved.
ipcMain.on('gotChatRefreshToken', function() {
    chatConnect();
});

// Chat Toggle
// Controls Turning on and off chat when connection button is pressed.
ipcMain.on('mixerChat', function(event, status) {
    if (status === "connect" || status === "connected") {
        // Do nothing as this is handled by the "gotRefreshToken" auth process.
    } else {
        // Kill connection.
        chatDisconnect();
    }
});

// Refresh Command Cache
// Refreshes backend command cache
ipcMain.on('refreshCommandCache', function() {
    refreshCommandCache();
});

// Export Functions
exports.connect = chatConnect;
exports.disconnect = chatDisconnect;
exports.whisper = whisper;
exports.broadcast = broadcast;
exports.timeout = timeout;
exports.clearChatMessages = clearChatMessages;
exports.chatGiveaway = chatGiveaway;
exports.changeUserRole = changeUserRole;
exports.chatPurge = chatPurge;
exports.getUser = getChatUserInfo;
exports.deleteChat = deleteChatMessage;
exports.getChatStatus = getChatStatus;
exports.getCommandCache = getCommandCache;
exports.refreshCommandCache = refreshCommandCache;