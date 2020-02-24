"use strict";

const request = require("request");
const Mixer = require('@mixer/client-node');
const ws = require("ws");
const retry = require('retry-as-promised');

const { ipcMain } = require("electron");
const commandHandler = require("../chat/commands/commandHandler");
const commandAccess = require("../data-access/command-access");
const chatProcessor = require("../common/handlers/chatProcessor.js");
const reconnectService = require("./reconnect.js");
const logger = require("../logwrapper");

const eventManager = require("../live-events/EventManager");
const accountAccess = require("./account-access");
const profileAccess = require("./profile-manager");
const userdb = require("../database/userDatabase");
const apiAccess = require("../api-access");
let linkHeaderParser = require('parse-link-header');
const timerManager = require("../timers/timer-manager");
const emotesManager = require("./emotes-manager");
const activeChatter = require('../roles/role-managers/active-chatters');

const chatModerationManager = require("../chat/moderation/chat-moderation-manager");

require('request-debug')(request, function(type, data) {
    //huge json response from steam, dont log this bad boi
    if (data.body && data.body.applist) return;
    logger.debug("Request debug: ", { type: type, data: JSON.stringify(data) });
});

const streamerClient = new Mixer.Client(new Mixer.DefaultRequestRunner());
const botClient = new Mixer.Client(new Mixer.DefaultRequestRunner());

// Options
let options = {
    cliendId: "f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9"
};

// This holds the connection status of chat.
let chatConnected = false;

// Get User Info
// This grabs the user info of a person in chat.
function getChatUserInfo(userID, callback) {
    let dbAuth = profileAccess.getJsonDbInProfile("/auth");
    let streamer = dbAuth.getData("/streamer");

    // Request User Info and return response.
    streamerClient
        .request("GET", `chats/` + streamer["channelId"] + "/users/" + userID)
        .then(response => {
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
    streamerClient
        .request("GET", "users/" + userID)
        .then(response => {
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
    let streamer = accountAccess.getAccounts().streamer;

    request.patch(
        "https://mixer.com/api/v1/channels/" + streamer.channelId,
        {
            auth: {
                bearer: streamer.auth.access_token
            },
            body: {
                name: title
            },
            json: true
        },
        err => {
            if (err) {
                logger.error("error setting title for channel", err);
            }
        }
    );
}

function updateStreamAudience(audienceType) {
    logger.info("updating channel aud to: " + audienceType);
    let streamer = accountAccess.getAccounts().streamer;

    request.patch(
        "https://mixer.com/api/v1/channels/" + streamer.channelId,
        {
            auth: {
                bearer: streamer.auth.access_token
            },
            body: {
                audience: audienceType
            },
            json: true
        },
        err => {
            if (err) {
                logger.error("error setting audience for channel", err);
            }
        }
    );
}

function updateStreamGame(gameQuery) {
    logger.info("updating channel game to: " + gameQuery);

    let streamer = accountAccess.getAccounts().streamer;

    streamerClient
        .request("GET", "types", {
            qs: {
                query: gameQuery
            }
        })
        .then(
            res => {
                let gameList = res.body;

                logger.silly(gameList);

                if (gameList != null && Array.isArray(gameList) && gameList.length > 0) {
                    let firstGame = gameList[0];

                    request.patch(
                        "https://mixer.com/api/v1/channels/" + streamer.channelId,
                        {
                            auth: {
                                bearer: streamer.auth.access_token
                            },
                            body: {
                                typeId: firstGame.id
                            },
                            json: true
                        },
                        err => {
                            if (err) {
                                logger.error("error setting game for channel", err);
                            }
                        }
                    );
                }
            },
            function(err) {
                logger.error("error while looking up games", err);
            }
        );
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
        let options = {
            url: `https://mixer.com/api/v1/${route}`,
            method: method,
            headers: {
                'User-Agent': 'MixerClient/0.13.0 (JavaScript; Node.js v6.5.0)'
            },
            json: true,
            body: body
        };

        let streamerData = accountAccess.getAccounts().streamer;
        if (streamerData.loggedIn) {
            options.headers['Authorization'] = `Bearer ${streamerData.auth.access_token}`;
        }

        request(options, function(err, res) {
            resolve(res);
        });
    });
}

async function createClip(title) {
    return retry(async function (options) {
        return new Promise(async (resolve, reject) => {
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

            let createClipRequest = {
                broadcastId: currentBroadcast.id,
                clipDurationInSeconds: 30
            };

            if (title != null) {
                createClipRequest.highlightTitle = title;
            }

            let createClipResponse = await requestAsStreamer('POST', 'clips/create', createClipRequest);

            logger.debug(createClipResponse.statusCode);
            logger.debug(createClipResponse.statusMessage);
            logger.debug(createClipResponse.body);

            if (createClipResponse.statusCode === 200) {
                logger.info(`Clip Info: Title '${title}' || Duration ${createClipRequest.clipDurationInSeconds}s || Broadcast Id ${currentBroadcast.id}`);
                clipResult.success = true;
                clipResult.highlightResponse = createClipResponse.body;
                clipResult.reason = "Success!";
                return resolve(clipResult);
            }

            if (options.current === 3 && createClipResponse.statusCode !== 200) {
                clipResult.success = false;
                clipResult.reason = `Failed to create a clip after several tries. (Code: ${createClipResponse.statusCode})`;
                return resolve(clipResult);
            }

            return reject();
        });
    }, {
        max: 4, // maximum amount of tries
        timeout: 5000, // throw if no response or error within millisecond timeout, default: undefined,
        backoffBase: 500, // Initial backoff duration in ms. Default: 100,
        backoffExponent: 1.5 // Exponent to increase backoff each try. Default: 1.1
    });
}

// Creates the chat websocket
// This sets up and auths with the chat websocket.
function createChatSocket (chatter, userId, channelId, endpoints, authkey) {
    logger.info(`Setting up chat socket for ${chatter}`);
    return new Promise((resolve, reject) => {
        if (authkey != null) {
            // Connect
            const socket = new Mixer.Socket(ws, endpoints).boot();

            // Handle errors
            // Without this the app seems to hang when the socket connection above gets server errors back.
            // With this the socket above seems to search for the next working connection point automatically.
            socket.on('error', error => {
                logger.error(`error from chat ${chatter} socket`, error);
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
                            logger.info('Successfully authenticated the bot chat socket!');
                            global.botChat = socket;

                            resolve("Bot");
                        } else {
                            logger.error(chatter + ' did not authenticate successfully.');
                            reject(res);
                        }
                    })
                    .catch(err => {
                        logger.error("Error authenticating bot for chat socket", err);
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

let pollActivelyRunning = false;

function setPollActivelyRunning(duration = 0) {
    pollActivelyRunning = true;
    setTimeout(() => {
        pollActivelyRunning = false;
    }, duration);
}

// Sets up chat data processing
// This sets up chat data processing after chat sockets are connected and created.
function createChatDataProcessing(chatter) {
    return new Promise((resolve, reject) => {
        let socket = [];

        logger.debug(`Creating chat data proccessing for ${chatter}`);

        // Refresh all caches.
        commandAccess.refreshCommandCache();

        // Setup all data processing!
        if (chatter === "Streamer") {
            socket = global.streamerChat;

            // React to chat messages
            socket.on("ChatMessage", data => {
                //Send to chat moderation service
                chatModerationManager.moderateMessage(data);

                // Send to command router to see if we need to act on a command.
                commandHandler.handleChatEvent(data, "streamer").catch(reason => {
                    logger.error("Could not check for command in chat message.", reason);
                });

                logger.debug("Recieved chat", data);

                // Increment Chat Messages in user DB.
                userdb.incrementDbField(data.user_id, "chatMessages");

                // Updates or adds user to our active chatter list.
                activeChatter.addOrUpdateActiveChatter(data);

                let chatFromStreamerChannel = accountAccess.getAccounts().streamer.channelId === data.channel;

                eventManager.triggerEvent("mixer", "chat-message", {
                    username: data.user_name,
                    data: data,
                    originatedInStreamerChannel: chatFromStreamerChannel
                });

                if (data.message.meta.whisper === true) {
                    if (data.user_name !== accountAccess.getAccounts().bot.username) {
                        // Send to UI to show in chat window.
                        chatProcessor.uiChatMessage(data);
                    }
                } else {
                    chatProcessor.uiChatMessage(data);

                    eventManager.triggerEvent("mixer", "viewer-arrived", {
                        username: data.user_name,
                        data: data,
                        originatedInStreamerChannel: chatFromStreamerChannel
                    });

                    if (data.user_name !== accountAccess.getAccounts().streamer.username &&
                        data.user_name !== accountAccess.getAccounts().bot.username) {
                        timerManager.incrementChatLineCounters();
                    }
                }

                // send skill event if needed
                if (data.message && data.message.meta && data.message.meta["is_skill"]) {
                    let skill = data.message.meta.skill;

                    // This may change at a later date. Also we may find a better way to determine Skill type once
                    // we get more documentation
                    skill.isSticker = true;

                    eventManager.triggerEvent("mixer", "skill", {
                        username: data.user_name,
                        data: {
                            skill: skill
                        },
                        originatedInStreamerChannel: chatFromStreamerChannel
                    });

                    if (chatFromStreamerChannel) {
                        renderWindow.webContents.send('eventlog', {
                            type: "general",
                            username: data.user_name,
                            event: `sent the Sticker "${skill.skill_name}" Cost: ${skill.cost} ${skill.currency}`
                        });
                    }
                }
            });

            // User joined the channel
            socket.on("UserJoin", data => {
                //logger.debug('chat user online: ', data.username);
                userdb.setChatUserOnline(data);
                data.fbEvent = "UserJoin";
                renderWindow.webContents.send("chatUpdate", data);

                eventManager.triggerEvent("mixer", "user-joined-chat", {
                    username: data.username,
                    data: data
                });
            });

            // User left the channel.
            socket.on("UserLeave", data => {
                data.fbEvent = "UserLeave";
                userdb.setChatUserOffline(data.id);
                renderWindow.webContents.send("chatUpdate", data);

                eventManager.triggerEvent("mixer", "user-left-chat", {
                    username: data.username,
                    data: data
                });
            });

            // Poll Started
            socket.on("PollStart", data => {
                data.fbEvent = "PollStart";
                renderWindow.webContents.send("chatUpdate", data);

                if (!pollActivelyRunning) {
                    setPollActivelyRunning(data.duration);
                    eventManager.triggerEvent("mixer", "poll-started", {
                        username: data.author.user_name,
                        data: data
                    });
                } else {
                    eventManager.triggerEvent("mixer", "poll-update", {
                        username: data.author.user_name,
                        data: data
                    });
                }

            });

            // Poll End
            socket.on("PollEnd", data => {
                data.fbEvent = "PollEnd";
                renderWindow.webContents.send("chatUpdate", data);

                eventManager.triggerEvent("mixer", "poll-ended", {
                    username: data.author.user_name,
                    data: data
                });
            });

            // Deleted Message
            socket.on("DeleteMessage", data => {
                data.fbEvent = "DeleteMessage";
                renderWindow.webContents.send("chatUpdate", data);
                logger.debug("delete" + JSON.stringify(data));

                eventManager.triggerEvent("mixer", "message-deleted", {
                    username: data.moderator.user_name,
                    data: data
                });
            });

            // Purge Message
            // Provides a moderator object if messages purged due to a ban.
            socket.on("PurgeMessage", data => {
                data.fbEvent = "PurgeMessage";
                renderWindow.webContents.send("chatUpdate", data);
                getUserInfo(data.user_id, user => {
                    //if purge has moderator, it was a timeout/purge
                    if (data.moderator !== undefined) {
                        eventManager.triggerEvent("mixer", "messages-purged", {
                            username: user.username,
                            data: data
                        });
                        //otherwise it was the result of a ban
                    } else {
                        eventManager.triggerEvent("mixer", "user-banned", {
                            username: user.username,
                            data: data
                        });
                    }
                });
            });

            // Clear Messages
            socket.on("ClearMessages", data => {
                data.fbEvent = "ClearMessages";
                renderWindow.webContents.send("chatUpdate", data);
                eventManager.triggerEvent("mixer", "chat-cleared", {
                    username: data.clearer.user_name,
                    data: data
                });
            });

            // User Update
            // Bans, subscribes, modding, etc...
            socket.on("UserUpdate", data => {
                data.fbEvent = "UserUpdate";
                getUserInfo(data.user, user => {
                    data.username = user.username;
                    renderWindow.webContents.send("chatUpdate", data);
                });

            });

            // User Timeout - Probably won't happen
            socket.on("UserTimeout", data => {
                data.fbEvent = "UserTimeout";
                renderWindow.webContents.send("chatUpdate", data);
            });

            // Non Chat based (aka not Sticker) Skill
            socket.on('SkillAttribution', data => {
                logger.debug("SkillAtro Chat Skill event");
                logger.debug(data);

                data.fbEvent = 'Skill';
                data.skill.isSticker = false;

                let isGif = data.skill.skill_id === 'ba35d561-411a-4b96-ab3c-6e9532a33027' ||
                    data.skill.skill_name.toLowerCase().includes("gif");

                // we trigger skill events for gifs via constellation instead because we have access to gif url there
                if (!isGif) {
                    eventManager.triggerEvent("mixer", "skill", {
                        username: data.user_name,
                        data: {
                            skill: data.skill
                        }
                    });
                }

                renderWindow.webContents.send('eventlog', {
                    type: "general",
                    username: data['user_name'],
                    event: `used the Skill "${data.skill.skill_name}" Cost: ${data.skill.cost} ${data.skill.currency}`
                });

                renderWindow.webContents.send('nonChatSkill', data);
            });

            let reconnectChat = () => {
                socket.close();
                // Set connection status to offline
                renderWindow.webContents.send("chatConnection", "Offline");

                // Set chat connection to offline.
                chatConnected = false;

                // Clear current chat messages and display alert message. It will resync them all on reconnect.
                renderWindow.webContents.send("chatUpdate", {
                    fbEvent: "Disconnected"
                });

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
            socket.on("ChatMessage", data => {
                commandHandler.handleChatEvent(data, "bot");

                if (data.message.meta.whisper === true) {
                    if (
                        data.user_name !== accountAccess.getAccounts().streamer.username
                    ) {
                        // Send to UI to show in chat window.
                        chatProcessor.uiChatMessage(data);
                    }
                }
            });

            let reconnectChat = () => {
                socket.close();
                // Set connection status to offline
                renderWindow.webContents.send("chatConnection", "Offline");

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

        reject("Invalid user given to chat data process setup.");
    });
}

// Disconnect from chat
// This should gracefully disconnect from chat.
function chatDisconnect() {
    if (global.streamerChat != null) {
        logger.info("Disconnecting streamer chat.");
        global.streamerChat.close();

        //flush cmd cooldowns
        commandHandler.flushCooldownCache();
    }
    if (global.botChat != null) {
        logger.info("Disconnecting bot chat.");
        global.botChat.close();
    }

    // Set connection status to offline
    renderWindow.webContents.send("chatConnection", "Offline");

    // Set chat connection to offline.
    chatConnected = false;
}

// Get current viewers
function getCurrentViewers() {
    logger.info("Attempting to get current viewer count");
    let streamer = accountAccess.getAccounts().streamer;

    return streamerClient
        .request("GET", "channels/" + streamer.channelId, {
            qs: {
                fields: "viewersCurrent"
            }
        })
        .then(
            res => {
                return res.body.viewersCurrent;
            },
            function(err) {
                logger.error("error while getting current viewers", err);
                return 0;
            }
        );
}

function getCurrentViewerList() {
    logger.info('Attempting to get current viewer list (v1)');
    let dbAuth = profileAccess.getJsonDbInUserData("/auth"),
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


function getContinuationToken(linkHeader) {
    let parsed = linkHeaderParser(linkHeader);
    if (parsed.next) {
        return parsed.next.continuationToken;
    }
    return null;
}


function getCurrentViewerListV2(users, continuationToken = null, namesOnly = false) {
    if (users == null) {
        users = [];
    }
    return new Promise(async (resolve, reject) => {

        let streamerChannelId = accountAccess.getAccounts().streamer.channelId;
        let urlRoute = `chats/${streamerChannelId}/users?limit=100`;

        if (continuationToken) {
            let encodedToken = encodeURIComponent(continuationToken);
            urlRoute += `&continuationToken=${encodedToken}`;
        }

        let response;
        try {
            response = await apiAccess.get(urlRoute, "v2", true);
        } catch (err) {
            return reject(err);
        }

        let userlistParsed = response.body;
        let userlistMapped = userlistParsed.map(u => {
            return namesOnly ? u.username : {
                userId: u.userId,
                username: u.username,
                user_roles: u.userRoles // eslint-disable-line camelcase
            };
        });

        users = users.concat(userlistMapped);

        let linkHeader = response.headers.link;
        if (linkHeader) {
            let newContinuationToken = getContinuationToken(linkHeader);
            resolve(getCurrentViewerListV2(users, newContinuationToken, namesOnly));
        } else {
            resolve(users);
        }
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
exports.getGeneralChannelData = function(
    channelNameOrId,
    getBroadcastData = true
) {
    return new Promise(async resolve => {
        if (channelNameOrId == null) {
            let dbAuth = profileAccess.getJsonDbInProfile("/auth"),
                streamer = dbAuth.getData("/streamer");
            channelNameOrId = streamer.channelId;
        }

        let generalDeets = {};
        try {
            let data = await streamerClient.request(
                "GET",
                "channels/" + channelNameOrId,
                {
                    qs: {
                        fields: "online,name,type,id,userId,token,viewersCurrent"
                    }
                }
            );
            generalDeets = data.body;
        } catch (err) {
            logger.error("error while getting channel deets", err);

            resolve(null);
            return;
        }

        if (getBroadcastData && generalDeets.online === true) {
            try {
                let broadcastData = await streamerClient.request(
                    "GET",
                    `channels/${generalDeets.id}/broadcast`,
                    {
                        qs: {
                            fields: "startedAt"
                        }
                    }
                );

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
    return new Promise(resolve => {
        // streamer Login
        streamerClient.use(
            new Mixer.OAuthProvider(streamerClient, {
                clientId: options.cliendId,
                tokens: {
                    access: streamer.auth.access_token,
                    expires: Date.now() + 365 * 24 * 60 * 60 * 1000
                }
            })
        );

        // Get our current chat users.
        getCurrentViewers().then(currentViewers => {
            renderWindow.webContents.send("currentViewersUpdate", {
                viewersCurrent: currentViewers
            });
        });

        // Request chat endpoints and connect.
        let userInfo;
        streamerClient
            .request("GET", `users/` + streamer.userId)
            .then(response => {
                userInfo = response.body;
                return new Mixer.ChatService(streamerClient).join(
                    response.body.channel.id
                );
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send(
                    "error",
                    "Error getting chat endpoints. Did you lose connection?"
                );

                // Set connection status to offline
                renderWindow.webContents.send("chatConnection", "Offline");

                // Log error for dev.
                logger.error("error while getting user", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect("Chat", false, false);
                return { then: function() {} };
            })
            .then(response => {
                const body = response.body;
                return createChatSocket(
                    "Streamer",
                    userInfo.id,
                    userInfo.channel.id,
                    body.endpoints,
                    body.authkey
                );
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send("error", "Error creating chat socket.");

                // Set connection status to offline
                renderWindow.webContents.send("chatConnection", "Offline");

                // Log error for dev.
                logger.error("error while creating chat socket", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect("Chat", false, false);
                return { then: function() {} };
            })
            .then(response => {
                return createChatDataProcessing(response);
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send(
                    "error",
                    "Error setting up chat data processing for Streamer."
                );

                // Set connection status to offline
                renderWindow.webContents.send("chatConnection", "Offline");

                // Log error for dev.
                logger.error(
                    "error while setting up chat data proccess for streamer",
                    error
                );

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect("Chat", false, false);
                return { then: function() {} };
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send(
                    "error",
                    "Error updating username cache for commands."
                );

                // Set connection status to offline
                renderWindow.webContents.send("chatConnection", "Offline");

                // Log error for dev.
                logger.error("error while upping username case for commands", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect("Chat", false, false);
                return { then: function() {} };
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send(
                    "error",
                    "Error starting timed commands or auto grouper."
                );

                // Set connection status to offline
                renderWindow.webContents.send("chatConnection", "Offline");

                // Log error for dev.
                logger.error("error while trying to start timed commands", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect("Chat", false, false);
                return { then: function() {} };
            })
            .then(() => {
                // Get chat history and send it to ui.
                chatProcessor.uiGetChatHistory(streamerClient);

                // Get chat user list and send it to ui.
                chatProcessor.uiChatUserRefresh();
            })
            .catch(error => {
                console.log(error);
                // Popup error.
                renderWindow.webContents.send(
                    "error",
                    "Error getting chat history or refreshing chat userlist."
                );

                // Set connection status to offline
                renderWindow.webContents.send("chatConnection", "Offline");

                // Log error for dev.
                logger.error("error while error getting chat history", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect("Chat", false, false);
                return { then: function() {} };
            })
            .then(() => {
                // Set connection status to online
                renderWindow.webContents.send("chatConnection", "Online");

                // Set chat connection to online.
                chatConnected = true;

                // Set anyone in chat to online in the viewer database.
                userdb.setChatUsersOnline();

                //flush cmd cooldowns
                commandHandler.flushCooldownCache();

                // Start active chatters list.
                activeChatter.cycleActiveChatters();

                // Fire the chat connected event.
                try {
                    eventManager.triggerEvent("firebot", "chat-connected", {
                        username: "Firebot"
                    });
                } catch (err) {
                    console.log("error triggering event");
                    console.log(err);
                }

                resolve(true);
            })
            .catch(error => {
                // Popup error.
                renderWindow.webContents.send(
                    "error",
                    "Error finishing chat connection processes."
                );

                // Set connection status to offline
                renderWindow.webContents.send("chatConnection", "Offline");

                // Log error for dev.
                logger.error("error while finishing chat connection processes", error);

                // Try to reconnect
                chatConnected = false;
                reconnectService.reconnect("Chat", false, false);
                return { then: function() {} };
            });
    });
}

// Bot Chat Connect
// This checks to see if bot info is available, and if so it will connect them to chat.
function botConnect(bot) {
    return new Promise((resolve) => {
        if (bot && bot.loggedIn) {


            let streamerChannelId = accountAccess.getAccounts().streamer.channelId;

            // Bot Login
            botClient.use(
                new Mixer.OAuthProvider(botClient, {
                    clientId: options.cliendId,
                    tokens: {
                        access: bot.auth.access_token,
                        expires: Date.now() + 365 * 24 * 60 * 60 * 1000
                    }
                })
            );

            let userInfo;
            // Request chat endpoints and connect.
            botClient
                .request("GET", `users/${bot.userId}`)
                .then(response => {
                    userInfo = response.body;
                    return new Mixer.ChatService(botClient).join(streamerChannelId);
                })
                .catch(error => {
                    // Popup error.
                    renderWindow.webContents.send(
                        "error",
                        "Error getting chat endpoints."
                    );

                    // Set connection status to offline
                    renderWindow.webContents.send("chatConnection", "Offline");

                    // Log error for dev.
                    logger.error("error while getting chat endpoints", error);

                    // Try to reconnect
                    chatConnected = false;
                    reconnectService.reconnect("Chat", false, false);
                    return { then: function() {} };
                })
                .then(response => {
                    const body = response.body;
                    return createChatSocket(
                        "Bot",
                        userInfo.id,
                        streamerChannelId,
                        body.endpoints,
                        body.authkey
                    );
                })
                .catch(error => {
                    // Popup error.
                    renderWindow.webContents.send(
                        "error",
                        "Couldnt connect to chat as the bot."
                    );

                    // Set connection status to offline
                    renderWindow.webContents.send("chatConnection", "Offline");

                    // Log error for dev.
                    logger.error("error while connecting to chat as bot", error);

                    // Try to reconnect
                    chatConnected = false;
                    reconnectService.reconnect("Chat", false, false);
                    return { then: function() {} };
                })
                .then(response => {
                    return createChatDataProcessing(response);
                })
                .catch(error => {
                    // Popup error.
                    renderWindow.webContents.send(
                        "error",
                        "Error setting up chat data processing for Bot."
                    );

                    // Set connection status to offline
                    renderWindow.webContents.send("chatConnection", "Offline");

                    // Log error for dev.
                    logger.error("error while setting up chat processing for bot", error);

                    // Try to reconnect
                    chatConnected = false;
                    reconnectService.reconnect("Chat", false, false);
                    return { then: function() {} };
                })
                .then(() => {
                    resolve(true);
                })
                .catch(error => {
                    // Log error for dev.
                    logger.error(error);

                    // Try to reconnect
                    chatConnected = false;

                    // Set connection status to offline
                    renderWindow.webContents.send('chatConnection', "Offline");

                    reconnectService.reconnect('Chat', false, false);
                    return {then: function() {} };
                });
        } else {
            resolve(true);
        }
    });
}

function reconnectIfConnected() {
    if (chatConnected) {
        // Try to reconnect
        chatConnected = false;

        // Set connection status to offline
        renderWindow.webContents.send('chatConnection', "Offline");

        reconnectService.reconnect('Chat', false, false);
    }
}

// Chat Connector
// This function connects to mixer chat and monitors messages.
function chatConnect() {
    return new Promise(async (resolve, reject) => {

        const streamer = accountAccess.getAccounts().streamer;

        if (!streamer.loggedIn) {
            renderWindow.webContents.send(
                "error",
                "You need to log into your streamer account to be able to connect to chat."
            );
            return reject();
        }

        let tokenSuccess = await accountAccess.ensureTokenRefreshed("streamer");
        if (!tokenSuccess) {
            renderWindow.webContents.send("error", "There was an issue refreshing your streamer account auth token. Please try again. If the issue persists, try re-logging into your account.");
            return reject();
        }

        try {
            await streamerConnect(streamer);
        } catch (err) {
            logger.error("error while connecting streamer", err);
            return reject();
        }

        emotesManager.updateEmotesCache();

        await accountAccess.ensureTokenRefreshed("bot");
        const bot = accountAccess.getAccounts().bot;
        if (bot.loggedIn) {
            try {
                await botConnect(bot);
            } catch (err) {
                logger.error("error while connecting bot", err);
                return reject();
            }
        }

        resolve();
    });
}

// Whisper
// Send a whisper to a specific person from whoever the chatter is (streamer or bot).
function whisper(chatter, username, message) {

    if (!chatConnected) {
        renderWindow.webContents.send('error', "Attempted to whipser to chat when chat doesnt appear to be connected. Please reconnect if issue persists.");
        return;
    }

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
            global.streamerChat.call("whisper", [username, message]);
            logger.info("Sent message as " + chatter + ".");
        } catch (err) {
            logger.eror("error sending whisper as streamer", err);
            renderWindow.webContents.send('error', "There was an error sending a whisper to chat as the streamer: " + err.message);
        }
    } else if (chatter === "bot") {
        try {
            if (global.botChat != null && global.botChat.isConnected != null && global.botChat.isConnected()) {
                global.botChat.call('whisper', [username, message]);
                logger.info('Sent message as ' + chatter + '.');
            } else {
                // fallback to sending as streamer
                if (global.streamerChat != null && global.streamerChat.isConnected()) {
                    logger.info('There appears to be an error with the bot, falling back to the Steamer account...');
                    global.streamerChat.call('whisper', [username, message]);
                } else {
                    logger.warn("We couldnt send chat as either the bot or streamer");
                    reconnectIfConnected();
                }
            }
        } catch (err) {
            logger.error("error sending whisper as bot", err);
            renderWindow.webContents.send('error', "There was an error sending a whisper to chat as the bot." + err.message);
        }
    }
}

// Broadcast
// Send a broadcast to the channel from whoever the chatter is (streamer or bot).
function broadcast(chatter, message) {

    if (!chatConnected) {
        renderWindow.webContents.send('error', "Attempted to broadcast to chat when chat doesnt appear to be connected. Please reconnect if issue persists.");
        return;
    }

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
            global.streamerChat.call("msg", [message]);
            logger.info("Sent message as " + chatter + ".");
            console.log("sent as streamer");
        } catch (err) {
            logger.error("error sending chat as streamer", err);
            renderWindow.webContents.send('error', "There was an error sending a message to chat as the streamer.");
        }
    } else if (chatter === "bot") {
        try {
            if (global.botChat != null && global.botChat.isConnected != null && global.botChat.isConnected()) {
                global.botChat.call('msg', [message]);
                logger.info('Sent message as ' + chatter + '.');
            } else {
                // looks like there is an issue with the bot, fall back to Streamer
                if (global.streamerChat != null && global.streamerChat.isConnected()) {
                    logger.info('There appears to be an error with the bot, falling back to the Steamer account...');
                    renderWindow.webContents.send('eventlog', {type: "general", username: "System", event: "- Attempted to chat as bot but there appears to be an issue. Falling back to streamer."});
                    global.streamerChat.call('msg', [message]);
                } else {
                    logger.warn("We couldnt send chat as either the bot or streamer");
                    reconnectIfConnected();
                }
            }

        } catch (err) {
            logger.error("error sending chat as bot", err);
            renderWindow.webContents.send('error', "There was an error sending a message to chat as the bot.");
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
    console.log("finished sending messages");
}

// Timeout
// Send a timeout request. This will time out a user for X amount of time.
function timeout(chatter, time) {
    global.streamerChat.call("timeout", [chatter, time]).then(
        () => {},
        () => {
            logger.debug("Failed to timeout user!");
        }
    );
}

// Delete Message
// This deletes a chat message by id.
function deleteChatMessage(id) {
    if (global.streamerChat != null) {
        global.streamerChat.call("deleteMessage", [id])
            .then(() => {
                logger.debug("Successfully deleted chat message");
            })
            .catch(err => {
                logger.warn("Failed to delete chat message, Mixer response: ", err);
            });
    }
}

// Clear Messages
// This clears all messages in chat.
function clearChatMessages() {
    global.streamerChat.call("clearMessages", []);
}

// Giveaway
// This starts the built in mixer giveaway feature.
function chatGiveaway() {
    global.streamerChat.call("giveaway:start", []);
}

// Purge
// This will purge all messages from a user.
function chatPurge(username) {
    global.streamerChat.call("purge", [username]);
}

// Change User Role
// This will change a user's role.
function changeUserRole(username, role, addOrRemove) {
    if (role === "Mod" || role === "Banned") {

        let streamer = accountAccess.getAccounts().streamer;

        // Request User Info and return response.
        streamerClient
            .request("GET", "channels/" + username + "?fields=userId&noCount=1")
            .then(response => {
                response = response.body;

                // Alright, lets set up our options packet.
                let userId = response.userId,
                    options = {
                        url:
                            `https://mixer.com/api/v1/channels/` +
                            streamer.channelId +
                            "/users/" +
                            userId,
                        method: "PATCH",
                        headers: {
                            Authorization: "Bearer " + streamer.auth.access_token,
                            "User-Agent": "MixerClient/0.13.0 (JavaScript; Node.js v6.5.0)"
                        },
                        json: true,
                        body: {}
                    };

                // Are we adding or removing a role?
                if (addOrRemove === "Add") {
                    options.body = {
                        add: [role]
                    };
                } else if (addOrRemove === "Remove") {
                    options.body = {
                        remove: [role]
                    };
                } else {
                    logger.error(
                        'addOrRemove variable can only be set to "Add" or "Remove" for changing roles.'
                    );
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
                                renderWindow.webContents.send("chatUpdate", {
                                    fbEvent: "ChatAlert",
                                    message: username + " has been modded."
                                });
                            } else if (role === "Banned") {
                                renderWindow.webContents.send("chatUpdate", {
                                    fbEvent: "ChatAlert",
                                    message: username + " has been banned."
                                });
                            }
                        } else if (addOrRemove === "Remove") {
                            if (role === "Mod") {
                                renderWindow.webContents.send("chatUpdate", {
                                    fbEvent: "ChatAlert",
                                    message: username + " has been unmodded."
                                });
                            } else if (role === "Banned") {
                                renderWindow.webContents.send("chatUpdate", {
                                    fbEvent: "ChatAlert",
                                    message: username + " has been unbanned."
                                });
                            }
                        }
                    } else {
                        // Error
                        renderWindow.webContents.send(
                            "error",
                            "Something went wrong while trying to change roles for this user."
                        );
                        logger.error(err);
                    }
                });
            })
            .catch(error => {
                // Log error for dev.
                logger.error(error);
                renderWindow.webContents.send(
                    "error",
                    "Something went wrong while trying to change roles for this user."
                );
            });
    } else {
        renderWindow.webContents.send(
            "error",
            "Firebot tried to change someone to an illegal role."
        );
    }
}

ipcMain.on("deleteChatMessage", function(event, data) {
    deleteChatMessage(data.messageId);
});

ipcMain.on("changeUserModStatus", function(event, data) {
    changeUserRole(data.userName, "Mod", data.modStatus ? "Add" : "Remove");
});

// Get connection status
function getChatStatus() {
    return chatConnected;
}

// Auth Process
// This kicks off the login process once refresh tokens are recieved.
ipcMain.on("gotChatRefreshToken", function() {
    chatConnect();
});

// Chat Toggle
// Controls Turning on and off chat when connection button is pressed.
ipcMain.on("mixerChat", function(event, status) {
    if (status === "connect" || status === "connected") {
    // Do nothing as this is handled by the "gotRefreshToken" auth process.
    } else {
    // Kill connection.
        chatDisconnect();

        // Set all users offline.
        userdb.setAllUsersOffline();
    }
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
exports.getCurrentViewers = getCurrentViewers;
exports.getCurrentViewerList = getCurrentViewerList;
exports.getCurrentViewerListV2 = getCurrentViewerListV2;
exports.updateStreamTitle = updateStreamTitle;
exports.updateStreamGame = updateStreamGame;
exports.updateStreamAudience = updateStreamAudience;
exports.createClip = createClip;
exports.requestAsStreamer = requestAsStreamer;