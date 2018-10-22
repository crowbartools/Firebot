'use strict';
const request = require('request');
const mixerInteractive = require('./mixer-interactive.js');
const Mixer = require('@mixer/client-node');
const ws = require('ws');
const dataAccess = require('./data-access.js');
const {ipcMain} = require('electron');
const Grouper = require('../interactive/auto-grouper');
const commandRouter = require("../chat/command-router.js");
const timedCommands = require("../chat/timed-commands.js");
const chatProcessor = require("../common/handlers/chatProcessor.js");
const reconnectService = require('./reconnect.js');
const logger = require('../logwrapper');
const { LiveEvent, EventType, EventSourceType } = require('../live-events/EventType');
const eventRouter = require('../live-events/events-router');
const accountAccess = require('./account-access');

require('request-debug')(request, function(type, data) {
    logger.debug("Request debug: ", { type: type, data: data });
});

const streamerClient = new Mixer.Client(new Mixer.DefaultRequestRunner());
const botClient = new Mixer.Client(new Mixer.DefaultRequestRunner());

// Options
let options = {
    cliendId: 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9'
};

// This holds the connection status of chat.
let chatConnected = false;

// Holds a cache of all commands.
let commandCache = [];

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
            logger.error("error getting chat user info", error);
            callback(null);
        });
}

function getUserInfo(userID, callback) {
    // Request User Info and return response.
    streamerClient.request('GET', "users/" + userID).then(response => {
        let user = response.body;
        callback(user);
    })
        .catch(error => {
            // Log error for dev.
            logger.error("error while getting user info", error);
            callback(null);
        });
}

function updateStreamTitle(title) {
    logger.info("updating channel title to: " + title);
    let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");
    let streamer = dbAuth.getData('/streamer');

    request.patch('https://mixer.com/api/v1/channels/' + streamer['channelId'], {
        'auth': {
            'bearer': streamer['accessToken']
        },
        'body': {
            name: title
        },
        json: true
    }, (err) => {
        if (err) {
            logger.error("error setting title for channel", err);
        }
    });

}

function updateStreamAudience(audienceType) {
    logger.info("updating channel aud to: " + audienceType);
    let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");
    let streamer = dbAuth.getData('/streamer');

    request.patch('https://mixer.com/api/v1/channels/' + streamer['channelId'], {
        'auth': {
            'bearer': streamer['accessToken']
        },
        'body': {
            audience: audienceType
        },
        json: true
    }, (err) => {
        if (err) {
            logger.error("error setting audience for channel", err);
        }
    });

}

function updateStreamGame(gameQuery) {
    logger.info("updating channel game to: " + gameQuery);
    let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");
    let streamer = dbAuth.getData('/streamer');

    streamerClient.request('GET', 'types', {
        qs: {
            query: gameQuery
        }
    })
        .then(res => {

            let gameList = res.body;

            logger.silly(gameList);

            if (gameList != null && Array.isArray(gameList) && gameList.length > 0) {

                let firstGame = gameList[0];

                request.patch('https://mixer.com/api/v1/channels/' + streamer['channelId'], {
                    'auth': {
                        'bearer': streamer['accessToken']
                    },
                    'body': {
                        typeId: firstGame.id
                    },
                    json: true
                }, (err) => {
                    if (err) {
                        logger.error("error setting game for channel", err);
                    }
                });
            }
        }, function (err) {
            logger.error("error while looking up games", err);
        });
}

function getCurrentBroadcast() {
    let streamerData = accountAccess.getAccounts().streamer;
    return streamerClient.request("GET", `channels/${streamerData.channelId}/broadcast`)
        .then(resp => {
            if (resp.statusCode === 200)
                return resp.body;

            return null;
        });
}

function requestAsStreamer(method, route, body) {
    return new Promise(resolve => {
        //updating account cache
        accountAccess.updateAccountCache();

        let streamerData = accountAccess.getAccounts().streamer;

        let options = {
            url: `https://mixer.com/api/v1/${route}`,
            method: method,
            headers: {
                'User-Agent': 'MixerClient/0.13.0 (JavaScript; Node.js v6.5.0)',
                'Authorization': `Bearer ${streamerData.accessToken}`
            },
            json: true,
            body: body
        };

        request(options, function(err, res) {
            resolve(res);
        });
    });
}

function createClip(title, duration) {
    return new Promise(async resolve => {
        logger.info("Attempting to create clip...");

        let clipResult = { success: false };

        let streamerData = accountAccess.getAccounts().streamer;

        if (!streamerData.partnered && !streamerData.canClip) {
            logger.warn("An unapproved user type attempted to create a clip!");
            clipResult.reason = "Not allowed to create clips!";
            return resolve(clipResult);
        }

        let currentBroadcast = await getCurrentBroadcast();
        if (currentBroadcast == null) {
            clipResult.reason = "Not currently broadcasting";
            return resolve(clipResult);
        }

        // make sure duration is valid
        if (isNaN(duration)) {
            duration = 30;
        } else if (duration < 15) {
            duration = 15;
        } else if (duration > 300) {
            duration = 300;
        }

        let createClipRequest = {
            broadcastId: currentBroadcast.id,
            clipDurationInSeconds: duration
        };

        if (title != null) {
            createClipRequest.highlightTitle = title;
        }

        logger.info(`Creating clip with title '${title}' and duration of ${duration}s for broadcast Id ${currentBroadcast.id}`);

        let createClipResponse = await requestAsStreamer('POST', 'clips/create', createClipRequest);

        logger.debug("Create clip response:");
        logger.debug(createClipResponse.statusCode);
        logger.debug(createClipResponse.statusMessage);
        logger.debug(createClipResponse.body);

        if (createClipResponse.statusCode === 200) {
            clipResult.success = true;
            clipResult.highlightResponse = createClipResponse.body;
        } else {
            clipResult.reason = `Create clip call to Mixer failed (status code ${createClipResponse.statusCode}`;
        }

        resolve(clipResult);
    });
}

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
                logger.info('Updated Command cache.');
            } catch (err) {
                logger.info('Command cache update failed. Retrying. (Try ' + retry + '/3)');
                retry = retry + 1;
                refreshCommandCache(retry);
            }
        } else {
            renderWindow.webContents.send('error', "Could not sync up command cache. Reconnect to try resyncing.");
        }
    }
}

refreshCommandCache();

// Creates the chat websocket
// This sets up and auths with the chat websocket.
function createChatSocket (chatter, userId, channelId, endpoints, authkey) {
    return new Promise((resolve, reject) => {
        if (authkey != null) {
            // Connect
            const socket = new Mixer.Socket(ws, endpoints).boot();

            // Handle errors
            // Without this the app seems to hang when the socket connection above gets server errors back.
            // With this the socket above seems to search for the next working connection point automatically.
            socket.on('error', error => {
                logger.error("error from chat socket", error);
            });

            // Confirm login.
            if (chatter === "Streamer") {
                socket.auth(channelId, userId, authkey)
                    .then((res) => {
                        if (res.authenticated === true) {
                            global.streamerChat = socket;
                            resolve("Streamer");
                        } else {
                            logger.error(chatter + ' did not authenticate successfully.');
                            reject(res);
                        }
                    })
                    .catch(err => {
                        reject(err);
                    });
            } else if (chatter === "Bot") {
                socket.auth(channelId, userId, authkey)
                    .then((res) => {
                        if (res.authenticated === true) {
                            global.botChat = socket;
                            resolve("Bot");
                        } else {
                            logger.error(chatter + ' did not authenticate successfully.');
                            reject(res);
                        }
                    })
                    .catch(err => {
                        reject(err);
                    });
            } else {
                reject('Error creating chat socket for ' + chatter + '.');
            }
        } else {
            logger.info('No auth key provided to connect to chat for ' + chatter);
        }
    });
}

// Sets up chat data processing
// This sets up chat data processing after chat sockets are connected and created.
function createChatDataProcessing(chatter) {
    return new Promise((resolve, reject) => {
        let socket = [];

        logger.debug("Creating chat data proccessing");

        // Refresh all caches.
        refreshCommandCache();
        mixerInteractive.refreshInteractiveCache();

        // Get controls to send on.
        let interactiveCache = mixerInteractive.getInteractiveCache();
        interactiveCache = interactiveCache['firebot'];

        // Setup all data processing!
        if (chatter === "Streamer") {
            socket = global.streamerChat;

            // React to chat messages
            socket.on('ChatMessage', data => {
            // Send to command router to see if we need to act on a command.
                commandRouter.handleChatCommand(data, 'streamer', interactiveCache, commandCache);

                logger.debug("Recieved chat", data);

                if (data.message.meta.whisper === true) {
                    if (data.user_name !== accountAccess.getAccounts().bot.username) {
                        // Send to UI to show in chat window.
                        chatProcessor.uiChatMessage(data);
                    }
                } else {
                    chatProcessor.uiChatMessage(data);
                }

                // Send event
                let event = new LiveEvent(EventType.CHAT_MESSAGE, EventSourceType.CHAT, {username: data.user_name, data: data});
                eventRouter.uncachedEvent(event);
            });

            // User joined the channel
            socket.on('UserJoin', data => {
                data.fbEvent = 'UserJoin';
                renderWindow.webContents.send('chatUpdate', data);
                let event = new LiveEvent(EventType.USER_JOINED_CHAT, EventSourceType.CHAT, {username: data.username, data: data});
                eventRouter.uncachedEvent(event);
            });

            // User left the channel.
            socket.on('UserLeave', data => {
                data.fbEvent = 'UserLeave';
                renderWindow.webContents.send('chatUpdate', data);
                let event = new LiveEvent(EventType.USER_LEAVE_CHAT, EventSourceType.CHAT, {username: data.username, data: data});
                eventRouter.uncachedEvent(event);
            });

            // Poll Started
            socket.on('PollStart', data => {
                data.fbEvent = 'PollStart';
                renderWindow.webContents.send('chatUpdate', data);
                let event = new LiveEvent(EventType.POLL_STARTED, EventSourceType.CHAT, {username: data.author.user_name, data: data});
                eventRouter.cachedEvent(event, data.endsAt);
            });

            // Poll End
            socket.on('PollEnd', data => {
                data.fbEvent = 'PollEnd';
                renderWindow.webContents.send('chatUpdate', data);
                let event = new LiveEvent(EventType.POLL_ENDED, EventSourceType.CHAT, {username: data.author.user_name, data: data});
                eventRouter.uncachedEvent(event);
            });

            // Deleted Message
            socket.on('DeleteMessage', data => {
                data.fbEvent = 'DeleteMessage';
                renderWindow.webContents.send('chatUpdate', data);
                logger.debug("delete" + JSON.stringify(data));
                let event = new LiveEvent(EventType.MESSAGE_DELETED, EventSourceType.CHAT, {username: data.moderator.user_name, data: data});
                eventRouter.uncachedEvent(event);
            });

            // Purge Message
            // Provides a moderator object if messages purged due to a ban.
            socket.on('PurgeMessage', data => {
                data.fbEvent = 'PurgeMessage';
                renderWindow.webContents.send('chatUpdate', data);
                getUserInfo(data.user_id, (user) => {
                    logger.info('username ' + user.username);
                    let event;
                    //if purge has moderator, it was a timeout/purge
                    if (data.moderator !== undefined) {
                        event = new LiveEvent(EventType.MESSAGE_PURGED, EventSourceType.CHAT, {username: user.username});
                    //otherwise it was the result of a ban
                    } else {
                        event = new LiveEvent(EventType.USER_BANNED, EventSourceType.CHAT, {username: user.username});
                    }
                    eventRouter.cachedEvent(event);
                });
            });

            // Clear Messages
            socket.on('ClearMessages', data => {
                data.fbEvent = 'ClearMessages';
                renderWindow.webContents.send('chatUpdate', data);
                let event = new LiveEvent(EventType.CHAT_CLEARED, EventSourceType.CHAT, {username: data.clearer.user_name, data: data});
                eventRouter.uncachedEvent(event);
            });

            // User Update
            // Bans, subscribes, modding, etc...
            socket.on('UserUpdate', data => {
                data.fbEvent = 'UserUpdate';
                renderWindow.webContents.send('chatUpdate', data);
            });

            // User Timeout - Probably won't happen
            socket.on('UserTimeout', data => {
                data.fbEvent = 'UserTimeout';
                renderWindow.webContents.send('chatUpdate', data);
                // let event = new LiveEvent(EventType.USER_TIMEOUT, EventSourceType.CHAT, {username: data.user.user_name, data: data});
                // eventRouter.uncachedEvent(event);
            });

            let reconnectChat = () => {
                socket.close();
                // Set connection status to offline
                renderWindow.webContents.send('chatConnection', "Offline");

                // Set chat connection to offline.
                chatConnected = false;

                // Clear current chat messages and display alert message. It will resync them all on reconnect.
                renderWindow.webContents.send('chatUpdate', {fbEvent: "Disconnected"});

                // Try to reconnect
                reconnectService.reconnect('Chat', false, false);
            };
            // Handle errors
            socket.on('error', error => {
                // Log for dev.
                logger.error("error from streamer chat socket", error);
                reconnectChat();
            });


            socket.on('closed', () => {
                if (chatConnected) {
                    reconnectChat();
                }
            });

            resolve(true);

        } else if (chatter === "Bot") {
            socket = global.botChat;

            // React to chat messages
            socket.on('ChatMessage', data => {
                commandRouter.handleChatCommand(data, 'bot', interactiveCache, commandCache);

                if (data.message.meta.whisper === true) {
                    if (data.user_name !== accountAccess.getAccounts().streamer.username) {
                        // Send to UI to show in chat window.
                        chatProcessor.uiChatMessage(data);
                    }
                }
            });

            let reconnectChat = () => {
                socket.close();
                // Set connection status to offline
                renderWindow.webContents.send('chatConnection', "Offline");

                // Set chat connection to offline.
                chatConnected = false;

                // Try to reconnect
                reconnectService.reconnect('Chat', false, false);
            };

            // Handle errors
            socket.on('error', error => {
                // Log for dev.
                logger.error("error from bot chat socket", error);

                reconnectChat();
            });

            socket.on('closed', () => {
                if (chatConnected) {
                    reconnectChat();
                }
            });

            resolve(true);
        }

        reject('Invalid user given to chat data process setup.');
    });
}

// Disconnect from chat
// This should gracefully disconnect from chat.
function chatDisconnect() {
    if (global.streamerChat != null) {
        logger.info('Disconnecting streamer chat.');
        global.streamerChat.close();
        global.streamerChat = null;

        // Stop timed command loop.
        timedCommands.timedCmdLoop(false);
    }
    if (global.botChat != null) {
        logger.info('Disconnecting bot chat.');
        global.botChat.close();
        global.botChat = null;
    }

    // Set connection status to offline
    renderWindow.webContents.send('chatConnection', "Offline");

    // Set chat connection to offline.
    chatConnected = false;
}

// Get current viewers
function getCurrentViewers() {
    logger.info('Attempting to get current viewer count');
    let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth"),
        streamer = dbAuth.getData('/streamer');

    return streamerClient.request('GET', 'channels/' + streamer.channelId, {
        qs: {
            fields: 'viewersCurrent'
        }
    })
        .then(res => {
            return res.body.viewersCurrent;
        }, function (err) {
            logger.error("error while getting current viewers", err);
            return 0;
        });
}

function getCurrentViewerList() {
    logger.info('Attempting to get current viewer count');
    let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth"),
        streamer = dbAuth.getData('/streamer');

    return streamerClient.request('GET', 'chats/' + streamer.channelId + "/users", {
        qs: {
            fields: 'userName'
        }
    })
        .then(res => {
            let usernames = res.body.map(u => u.userName);
            usernames.push(streamer.username);
            return usernames;
        }, function (err) {
            logger.error("error while getting current viewer list", err);
            return [];
        });
}

exports.getUserAvatarUrl = function(channelNameOrId) {
    return new Promise(async resolve => {
        if (channelNameOrId == null) {
            channelNameOrId = accountAccess.getAccounts().streamer.channelId;
        }

        let data = await streamerClient.request('GET', 'channels/' + channelNameOrId);

        resolve(data.body.user.avatarUrl);
    });
};

// Gets general channel data, defaults to streamer data
exports.getGeneralChannelData = function(channelNameOrId, getBroadcastData = true) {
    return new Promise(async resolve => {
        if (channelNameOrId == null) {
            let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth"),
                streamer = dbAuth.getData('/streamer');
            channelNameOrId = streamer.channelId;
        }

        let generalDeets = {};
        try {
            let data = await streamerClient.request('GET', 'channels/' + channelNameOrId, {
                qs: {
                    fields: 'online,name,type,id,userId,token,viewersCurrent'
                }
            });
            generalDeets = data.body;
        } catch (err) {
            logger.error("error while getting channel deets", err);

            resolve(null);
            return;
        }

        if (getBroadcastData && generalDeets.online === true) {
            try {
                let broadcastData = await streamerClient.request('GET', `channels/${generalDeets.id}/broadcast`, {
                    qs: {
                        fields: 'startedAt'
                    }
                });

                generalDeets.startedAt = broadcastData.body.startedAt;
            } catch (err) {
                logger.error("error while getting broadcast deets", err);
            }
        }

        resolve(generalDeets);
    });
};

// Streamer Chat Connect
// This checks to see if the streamer is logged into the app, and if so it will connect them to chat.
function streamerConnect(streamer) {
    return new Promise((resolve) => {
        let userInfo;

        // Bot Login
        streamerClient.use(new Mixer.OAuthProvider(streamerClient, {
            clientId: options.cliendId,
            tokens: {
                access: streamer.accessToken,
                expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
            }
        }));

        getCurrentViewers().then(currentViewers => {
            renderWindow.webContents.send('currentViewersUpdate', { viewersCurrent: currentViewers });
        });

        // Request chat endpoints and connect.
        streamerClient.request('GET', `users/` + streamer['userId'])
            .then(response => {
                userInfo = response.body;
                return new Mixer.ChatService(streamerClient).join(response.body.channel.id);
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send('error', "Error getting chat endpoints. Did you lose connection?");

                // Set connection status to offline
                renderWindow.webContents.send('chatConnection', "Offline");

                // Log error for dev.
                logger.error("error while getting user", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect('Chat', false, false);
                return {then: function() {} };
            })
            .then(response => {
                const body = response.body;
                return createChatSocket("Streamer", userInfo.id, userInfo.channel.id, body.endpoints, body.authkey);
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send('error', "Error creating chat socket.");

                // Set connection status to offline
                renderWindow.webContents.send('chatConnection', "Offline");

                // Log error for dev.
                logger.error("error while creating chat socket", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect('Chat', false, false);
                return {then: function() {} };
            })
            .then(response => {
                return createChatDataProcessing(response);
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send('error', "Error setting up chat data processing for Streamer.");

                // Set connection status to offline
                renderWindow.webContents.send('chatConnection', "Offline");

                // Log error for dev.
                logger.error("error while setting up chat data proccess for streamer", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect('Chat', false, false);
                return {then: function() {} };
            })
            .then(() => {
                // Update streamer name for chat permissions.
                commandRouter.updateStreamerUsername();

                accountAccess.updateAccountCache();
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send('error', "Error updating username cache for commands.");

                // Set connection status to offline
                renderWindow.webContents.send('chatConnection', "Offline");

                // Log error for dev.
                logger.error("error while upping username case for commands", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect('Chat', false, false);
                return {then: function() {} };
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send('error', "Error starting timed commands or auto grouper.");

                // Set connection status to offline
                renderWindow.webContents.send('chatConnection', "Offline");

                // Log error for dev.
                logger.error("error while trying to start timed commands", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect('Chat', false, false);
                return {then: function() {} };
            })
            .then(() => {
                // Get chat history and send it to ui.
                chatProcessor.uiGetChatHistory(streamerClient);

                // Get chat user list and send it to ui.
                chatProcessor.uiChatUserRefresh(0, []);
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send('error', "Error getting chat history or refreshing chat userlist.");

                // Set connection status to offline
                renderWindow.webContents.send('chatConnection', "Offline");

                // Log error for dev.
                logger.error("error while error getting chat history", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect('Chat', false, false);
                return {then: function() {} };
            })
            .then(() => {
                // Set connection status to online
                renderWindow.webContents.send('chatConnection', "Online");

                // Set chat connection to online.
                chatConnected = true;

                // Start timed command loop.
                timedCommands.timedCmdLoop(true);

                // Start auto grouper if both chat and interactive connected.
                // This auto groups people for interactive groups and depends on chat being connected.
                Grouper.startQueue();


                // Fire the chat connected event.
                let event = new LiveEvent(EventType.CHAT_CONNECTED, EventSourceType.FIREBOT, {username: "Firebot"});
                eventRouter.uncachedEvent(event);

                resolve(true);
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send('error', "Error finishing chat connection processes.");

                // Set connection status to offline
                renderWindow.webContents.send('chatConnection', "Offline");

                // Log error for dev.
                logger.error("error while finsing chat connection processes", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect('Chat', false, false);
                return {then: function() {} };
            });
    });

}

// Bot Chat Connect
// This checks to see if bot info is available, and if so it will connect them to chat.
function botConnect(botter) {
    return new Promise((resolve, reject) => {
        if (botter !== []) {
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
                .catch(error => {
                // Popup error.
                    renderWindow.webContents.send('error', "Error getting chat endpoints.");

                    // Set connection status to offline
                    renderWindow.webContents.send('chatConnection', "Offline");

                    // Log error for dev.
                    logger.error("error while getting chat endpoints", error);

                    // Try to reconnect
                    chatConnected = false;
                    reconnectService.reconnect('Chat', false, false);
                    return {then: function() {} };
                })
                .then(response => {
                    const body = response.body;
                    return createChatSocket("Bot", userInfo.id, streamer['channelId'], body.endpoints, body.authkey);
                })
                .catch(error => {
                    // Popup error.
                    renderWindow.webContents.send('error', "Couldnt connect to chat as the bot.");

                    // Set connection status to offline
                    renderWindow.webContents.send('chatConnection', "Offline");

                    // Log error for dev.
                    logger.error("error while connecting to chat as bot", error);

                    // Try to reconnect
                    chatConnected = false;
                    reconnectService.reconnect('Chat', false, false);
                    return {then: function() {} };
                })
                .then(response => {
                    return createChatDataProcessing(response);
                })
                .catch(error => {
                    // Popup error.
                    renderWindow.webContents.send('error', "Error setting up chat data processing for Bot.");

                    // Set connection status to offline
                    renderWindow.webContents.send('chatConnection', "Offline");

                    // Log error for dev.
                    logger.error("error while setting up chat processing for bot", error);

                    // Try to reconnect
                    chatConnected = false;
                    reconnectService.reconnect('Chat', false, false);
                    return {then: function() {} };
                })
                .then(() => {
                    resolve(true);
                })
                .catch(error => {
                    reject(error);
                    // Log error for dev.
                    //logger.error(error);

                    // Try to reconnect
                    chatConnected = false;
                    reconnectService.reconnect('Chat', false, false);
                    return {then: function() {} };
                });
        } else {
            resolve(true);
        }

    });

}

// Chat Connector
// This function connects to mixer chat and monitors messages.
function chatConnect() {
    return new Promise((resolve, reject) => {
        let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth"),
            streamer = [],
            botter = [];

        // Get streamer data.
        try {
            streamer = dbAuth.getData('/streamer');
        } catch (err) {
            renderWindow.webContents.send('error', "You need to sign into the app as a streamer to connect to chat.");
            reject(err);
            return;
        }

        // Get Bot Data
        try {
            botter = dbAuth.getData('/bot');
        } catch (err) {
            logger.info('No bot logged in. Skipping. (chat-connect)');
        }

        // Connect Kickoff
        streamerConnect(streamer)
            .then(() => {
                botConnect(botter);
            })
            .catch(err => {
                logger.error("error while connecting streamer/bot", err);
                reject(err);
            });
    });
}

// Whisper
// Send a whisper to a specific person from whoever the chatter is (streamer or bot).
function whisper(chatter, username, message) {

    if (message == null || message.trim() === "") {
        return;
    }

    if (message.length > 360) {
        message = message.substring(0, 359);
    }

    // Normalize the chatter type
    chatter = chatter.toLowerCase();

    if (chatter === "streamer") {
        try {
            global.streamerChat.call('whisper', [username, message]);
            logger.info('Sent message as ' + chatter + '.');
        } catch (err) {
            logger.eror("error sending whisper as streamer", err);
            renderWindow.webContents.send('error', "There was an error sending a whisper to chat as the streamer. If you are testing a chat button, please make sure Interactive is connected.");
        }
    } else if (chatter === "bot") {
        try {
            global.botChat.call('whisper', [username, message]);
            logger.info('Sent message as ' + chatter + '.');
        } catch (err) {
            logger.error("error sending whisper as bot", err);
            renderWindow.webContents.send('error', "There was an error sending a whisper to chat as the bot. If you are testing a chat button, please make sure Interactive is connected.");
        }
    }
}

// Broadcast
// Send a broadcast to the channel from whoever the chatter is (streamer or bot).
function broadcast(chatter, message) {

    if (message == null || message.trim() === "") {
        return;
    }

    if (message.length > 360) {
        message = message.substring(0, 359);
    }

    // Normalize the chatter type
    chatter = chatter.toLowerCase();
    if (chatter === "streamer") {
        try {
            global.streamerChat.call('msg', [message]);
            logger.info('Sent message as ' + chatter + '.');
        } catch (err) {
            logger.error("error sending chat as streamer", err);
            renderWindow.webContents.send('error', "There was an error sending a message to chat as the streamer. If you are testing a chat button, please make sure Interactive is connected.");
        }
    } else if (chatter === "bot") {
        try {
            global.botChat.call('msg', [message]);
            logger.info('Sent message as ' + chatter + '.');
        } catch (err) {
            logger.error("error sending chat as bot", err);
            renderWindow.webContents.send('error', "There was an error sending a message to chat as the bot. If you are testing a chat button, please make sure Interactive is connected.");
        }
    }
}

/**
 * Send message as the bot if available, otherwise as the streamer.
 * If a username is provided, the message will be whispered.
 * If the message is too long, it will be automatically broken into multiple fragments and sent individually.
 *
 * @param {string} message The message to send
 * @param {string} [username] If provided, message will be whispered to the given user.
 * @param {string} [chatter] Which account to chat as. Defaults to bot if available otherwise, the streamer.
 */
function smartSend(message, username, chatter) {
    if (message == null) return;

    if (chatter == null) {
        chatter = accountAccess.getAccounts().bot.loggedIn ? "bot" : "streamer";
    }

    let shouldWhisper = username != null && username !== "",
        // returns an array with the message broken into fragments 360 chars or less
        messageFragments = message.match(/[\s\S]{1,360}/g);

    // loop through and send all message fragments
    for (let msgFragment of messageFragments) {
        // get rid of any trailing or leading spaces
        let trimmedFragment = msgFragment.trim();
        if (trimmedFragment === "") continue;

        if (shouldWhisper) {
            whisper(chatter, username, trimmedFragment);
        } else {
            broadcast(chatter, trimmedFragment);
        }
    }
}

// Timeout
// Send a timeout request. This will time out a user for X amount of time.
function timeout(chatter, time) {
    global.streamerChat.call('timeout', [chatter, time]).then(() => {}, () => {
        logger.debug("Failed to timeout user!");
    });
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
                logger.error('addOrRemove variable can only be set to "Add" or "Remove" for changing roles.');
                return;
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
                    logger.error(err);
                }
            });

        })
            .catch(error => {
                // Log error for dev.
                logger.error(error);
                renderWindow.webContents.send('error', "Something went wrong while trying to change roles for this user.");
            });
    } else {
        renderWindow.webContents.send('error', "Firebot tried to change someone to an illegal role.");
    }
}

ipcMain.on('deleteChatMessage', function(event, data) {
    deleteChatMessage(data.messageId);
});

ipcMain.on('changeUserModStatus', function(event, data) {
    changeUserRole(data.userName, "Mod", data.modStatus ? "Add" : "Remove");
});

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
exports.smartSend = smartSend;
exports.timeout = timeout;
exports.clearChatMessages = clearChatMessages;
exports.chatGiveaway = chatGiveaway;
exports.changeUserRole = changeUserRole;
exports.chatPurge = chatPurge;
exports.getUser = getChatUserInfo;
exports.deleteChat = deleteChatMessage;
exports.getChatStatus = getChatStatus;
exports.getCommandCache = getCommandCache;
exports.getCurrentViewers = getCurrentViewers;
exports.refreshCommandCache = refreshCommandCache;
exports.getCurrentViewerList = getCurrentViewerList;
exports.updateStreamTitle = updateStreamTitle;
exports.updateStreamGame = updateStreamGame;
exports.updateStreamAudience = updateStreamAudience;
exports.createClip = createClip;