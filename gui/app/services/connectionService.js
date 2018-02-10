'use strict';

(function() {

    // This handles logins and connections to mixer interactive

    const electronOauth2 = require('electron-oauth2');
    const dataAccess = require('../../lib/common/data-access.js');
    const {session} = require('electron').remote;

    angular
        .module('firebotApp')
        .factory('connectionService', function (listenerService, settingsService, soundService, utilityService, $q, $rootScope, boardService, logger) {
            let service = {};

            let ListenerType = listenerService.ListenerType;

            // Auth Options
            let streamerScopes = "user:details:self interactive:robot:self chat:connect chat:chat chat:whisper chat:bypass_links chat:bypass_slowchat chat:bypass_catbot chat:bypass_filter chat:clear_messages chat:giveaway_start chat:poll_start chat:remove_message chat:timeout chat:view_deleted chat:purge channel:details:self channel:update:self";
            let botScopes = "chat:connect chat:chat chat:whisper chat:bypass_links chat:bypass_slowchat";

            let authInfo = {
                clientId: 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9',
                authorizationUrl: "https://mixer.com/oauth/authorize",
                tokenUrl: "https://mixer.com/api/v1/oauth/token",
                useBasicAuthorizationHeader: false,
                redirectUri: "https://firebottle.tv/Firebot/oauth/redirect.php"
            };

            let authWindowParams = {
                alwaysOnTop: true,
                autoHideMenuBar: true,
                webPreferences: {
                    sandbox: true
                }
            };

            /**
            * Login Stuff
            */

            let defaultPhotoUrl = "../images/placeholders/default.jpg";

            function logout(type) {
                let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");

                if (type === "streamer") {
                    // Delete Info
                    dbAuth.delete('/streamer');

                    let streamerAccount = service.accounts.streamer;
                    streamerAccount.username = "Broadcaster";
                    streamerAccount.photoUrl = defaultPhotoUrl;
                    streamerAccount.isLoggedIn = false;

                } else {
                    // Delete Info
                    dbAuth.delete('/bot');

                    let botAccount = service.accounts.bot;
                    botAccount.username = "Bot";
                    botAccount.photoUrl = defaultPhotoUrl;
                    botAccount.isLoggedIn = false;

                }
            }

            // User Info
            // This function grabs info from the currently logged in user.
            function userInfo(type, accessToken, refreshToken) {
                let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");

                // Request user info and save out everything to auth file.
                request({
                    url: 'https://mixer.com/api/v1/users/current',
                    auth: {
                        'bearer': accessToken
                    }
                }, function (err, res) {
                    let data = JSON.parse(res.body);

                    // Push all to db.
                    dbAuth.push('./' + type + '/username', data.username);
                    dbAuth.push('./' + type + '/userId', data.id);
                    dbAuth.push('./' + type + '/channelId', data.channel.id);
                    dbAuth.push('./' + type + '/avatar', data.avatarUrl);
                    dbAuth.push('./' + type + '/accessToken', accessToken);
                    dbAuth.push('./' + type + '/refreshToken', refreshToken);

                    // Style up the login page.
                    $q.resolve(true, () => {
                        service.loadLogin();
                        $rootScope.showSpinner = false;
                    });


                    // Request channel info
                    // We do this to get the sub icon to use in the chat window.
                    request({
                        url: 'https://mixer.com/api/v1/channels/' + data.username + '?fields=badge,partnered'
                    }, function (err, res) {
                        let data = JSON.parse(res.body);

                        // Push all to db.
                        if (data.partnered === true) {
                            dbAuth.push('./' + type + '/subBadge', data.badge.url);
                        } else {
                            dbAuth.push('./' + type + '/subBadge', false);
                        }
                    });
                });
            }

            function login(type) {
                $rootScope.showSpinner = true;

                let scopes = type === "streamer" ? streamerScopes : botScopes;

                // clear out any previous sessions
                const ses = session.fromPartition(type);
                ses.clearStorageData();

                authWindowParams.webPreferences.partition = type;
                const oauthProvider = electronOauth2(authInfo, authWindowParams);
                $q.when(oauthProvider.getAccessToken({ scope: scopes }))
                    .then(token => {
                        if (token.name != null && token.name === "ValidationError") {
                            utilityService.showErrorModal("There was an issue logging into Mixer. Error: " + token.details[0].message);
                            logger.error("There was an issue logging into Mixer. Error: " + token.details[0].message, token);
                        } else {
                            userInfo(type, token.access_token, token.refresh_token);
                        }
                    }, err => {
                        //error requesting access
                        $rootScope.showSpinner = false;
                        logger.error("Error requesting access for oauth token. " + err);
                        utilityService.showErrorModal('Error requesting access for oauth token.');
                    });
            }

            // Refresh Token
            // This will get a new access token for the streamer and bot account.
            function refreshToken(connectionType) {
                let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");

                logger.info('Trying to get refresh tokens...');

                // Refresh streamer token if the streamer is logged in.
                try {
                    let refresh = dbAuth.getData('./streamer/refreshToken');
                    authWindowParams.webPreferences.partition = 'refreshStreamer';
                    let oauthProvider = electronOauth2(authInfo, authWindowParams);
                    oauthProvider.refreshToken(refresh)
                        .then(token => {
                            logger.info('Got refresh token!');

                            // Success!
                            let accessToken = token.access_token;
                            let refreshToken = token.refresh_token;

                            // Awesome, we got the auth token. Now to save it out for later.
                            // Push all to db.
                            if (accessToken !== null && accessToken !== undefined && accessToken !== "") {
                                dbAuth.push('./streamer/accessToken', accessToken);
                                dbAuth.push('./streamer/refreshToken', refreshToken);
                            } else {
                                logger.error('Something went wrong with streamer refresh token.', token);

                                // Set connecting to false and log the streamer out because we have oauth issues.
                                service.waitingForChatStatusChange = false;
                                logout('streamer');

                                utilityService.showErrorModal('There was an error authenticating your streamer account. Please log in again.');
                                return;
                            }

                            // Refresh bot token if the bot is logged in.
                            try {
                                let refresh = dbAuth.getData('./bot/refreshToken');
                                oauthProvider.refreshToken(refresh).then(token => {

                                    // Success!
                                    let accessToken = token.access_token;
                                    let refreshToken = token.refresh_token;

                                    // Awesome, we got the auth token. Now to save it out for later.
                                    // Push all to db.
                                    if (accessToken !== null && accessToken !== undefined && accessToken !== "") {
                                        dbAuth.push('./bot/accessToken', accessToken);
                                        dbAuth.push('./bot/refreshToken', refreshToken);
                                    } else {
                                        logger.error('Something went wrong with bot refresh token.', token);
                                        utilityService.showErrorModal('There was an error authenticating your bot account. Please log in again.');

                                        // Set connecting to false and log the streamer out because we have oauth issues.
                                        service.waitingForChatStatusChange = false;
                                        service.disconnectFromInteractive();
                                        logout('bot');

                                        return;
                                    }

                                    // Okay, we have both streamer and bot tokens now. Start up the login process.
                                    if (connectionType === "interactive") {
                                        ipcRenderer.send('gotRefreshToken');
                                    } else if (connectionType === "chat") {
                                        ipcRenderer.send('gotChatRefreshToken');
                                    } else if (connectionType === "constellation") {
                                        ipcRenderer.send('gotConstellationRefreshToken');
                                    }

                                }, err => {
                                    // There was an error getting the bot token.
                                    logger.error(err);
                                    utilityService.showErrorModal('There was an error authenticating your bot account. Please log in again.');

                                    // Set connecting to false and log the streamer out because we have oauth issues.
                                    service.waitingForChatStatusChange = false;
                                    service.disconnectFromInteractive();
                                    logout('bot');

                                    return;
                                });
                            } catch (err) {
                                logger.debug('No bot logged in. Skipping refresh token.');

                                // We have the streamer token, but there is no bot logged in. So... start up the login process.
                                if (connectionType === "interactive") {
                                    ipcRenderer.send('gotRefreshToken');
                                } else if (connectionType === "chat") {
                                    ipcRenderer.send('gotChatRefreshToken');
                                } else if (connectionType === "constellation") {
                                    ipcRenderer.send('gotConstellationRefreshToken');
                                }
                            }

                        },
                        (err) => {
                            //error getting streamer refresh token
                            logger.error(err);

                            // Set connecting to false and log the streamer out because we have oauth issues.
                            service.waitingForChatStatusChange = false;
                            logout('streamer');

                            utilityService.showErrorModal('There was an error authenticating your streamer account. Please log in again.');
                            return;
                        });
                } catch (err) {
                    // The streamer isn't logged in... stop everything.
                    service.waitingForChatStatusChange = false;
                    service.isConnectingAll = false;
                    logger.warn('No streamer logged in. Skipping refresh token.');
                    utilityService.showErrorModal("You need to log into the app before trying to connect to Mixer.");
                    return;
                }
            }

            service.accounts = {
                streamer: {
                    username: "Streamer",
                    photoUrl: "../images/placeholders/default.jpg",
                    isLoggedIn: false
                },
                bot: {
                    username: "Bot",
                    photoUrl: "../images/placeholders/default.jpg",
                    isLoggedIn: false
                }
            };

            // Login Kickoff
            service.loginOrLogout = function(type) {
                if ((type === 'streamer' && !service.accounts.streamer.isLoggedIn) ||
            (type === 'bot' && !service.accounts.bot.isLoggedIn)) {
                    // We need to login
                    login(type);
                } else {
                    // We need to logout
                    logout(type);
                }
            };

            // Load Login
            // This function populates the accounnt fields which will in turn update the ui
            service.loadLogin = function() {
                let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");

                let username, avatar;
                // Get streamer info.
                try {
                    let streamer = dbAuth.getData('/streamer');

                    if (streamer != null) {
                        service.accounts.streamer.isLoggedIn = true;

                        username = streamer.username;
                        avatar = streamer.avatar;

                        if (avatar != null) {
                            service.accounts.streamer.photoUrl = avatar;
                        }

                        if (username != null) {
                            service.accounts.streamer.username = username;
                        }
                    }
                } catch (error) {
                    logger.warn('No streamer logged into the app.');
                }
                // Get bot info
                try {
                    let bot = dbAuth.getData('/bot');

                    if (bot != null) {
                        service.accounts.bot.isLoggedIn = true;

                        username = bot.username;
                        avatar = bot.avatar;

                        if (avatar != null) {
                            service.accounts.bot.photoUrl = avatar;
                        }

                        if (username != null) {
                            service.accounts.bot.username = username;
                        }
                    }
                } catch (error) {
                    logger.warn('No bot logged into the app.');
                }
            };

            /**
            * Interactive Connection Stuff
            */

            service.isConnectingAll = false;

            service.connectedToInteractive = false;
            service.waitingForStatusChange = false;
            service.connectedBoard = "";

            service.toggleConnectionToInteractive = function() {
                // Clear all reconnect timeouts if any are running.
                ipcRenderer.send('clearReconnect', "Interactive");

                if (service.connectedToInteractive === true) {
                    service.disconnectFromInteractive();
                } else if (!service.waitingForChatStatusChange) {
                    service.connectToInteractive();
                }
            };

            service.connectToInteractive = function() {
                // Let's connect! Get new tokens and connect.
                if (service.waitingForStatusChange) return false;

                if (!boardService.hasBoardsLoaded()) {
                    utilityService.showInfoModal("Interactive will not connect as you do not have any boards loaded. If you do not plan to use Interactive right now, you can disable it's use by the sidebar connection button via the Connection Panel.");
                    return;
                }

                service.waitingForStatusChange = true;

                let lastBoard = boardService.getBoardById(settingsService.getLastBoardId());

                service.connectedBoard = lastBoard ? lastBoard.name : "";
                refreshToken('interactive');
            };

            service.disconnectFromInteractive = function() {
                // Disconnect!
                service.waitingForStatusChange = true;
                ipcRenderer.send('mixerInteractive', 'disconnect');
            };

            // Connection Monitor
            // Recieves event from main process that connection has been established or disconnected.
            listenerService.registerListener(
                { type: ListenerType.CONNECTION_STATUS },
                (isConnected) => {
                    service.connectedToInteractive = isConnected;

                    if (!service.isConnectingAll) {
                        let soundType = isConnected ? "Online" : "Offline";
                        soundService.connectSound(soundType);
                    }

                    let status = isConnected ? "connected" : "disconnected";
                    $rootScope.$broadcast("connection:update", { type: "interactive", status: status });

                    service.waitingForStatusChange = false;
                });

            // Connect Request
            // Recieves an event from the main process when the global hotkey is hit for connecting.
            listenerService.registerListener(
                { type: ListenerType.CONNECTION_CHANGE_REQUEST },
                () => {
                    service.toggleConnectionToInteractive();
                });


            /**
            * Chat Connection Stuff
            */
            service.connectedToChat = false;
            service.waitingForChatStatusChange = false;

            service.toggleConnectionToChat = function() {
                // Clear all reconnect timeouts if any are running.
                ipcRenderer.send('clearReconnect', "Chat");

                if (service.connectedToChat === true) {
                    service.disconnectFromChat();
                } else if (!service.waitingForStatusChange) {
                    service.connectToChat();
                }
            };

            service.connectToChat = function() {
                // Let's connect! Get new tokens and connect.
                if (service.waitingForChatStatusChange) return;
                service.waitingForChatStatusChange = true;
                refreshToken('chat');
            };

            service.disconnectFromChat = function() {
                // Disconnect!
                service.waitingForChatStatusChange = true;
                ipcRenderer.send('mixerChat', 'disconnect');
            };

            // Connection Monitor
            // Recieves event from main process that connection has been established or disconnected.
            listenerService.registerListener(
                { type: ListenerType.CHAT_CONNECTION_STATUS },
                (isChatConnected) => {
                    service.connectedToChat = isChatConnected;

                    if (!service.isConnectingAll) {
                        let soundType = isChatConnected ? "Online" : "Offline";
                        soundService.connectSound(soundType);
                    }

                    let status = isChatConnected ? "connected" : "disconnected";
                    $rootScope.$broadcast("connection:update", { type: "chat", status: status });

                    service.waitingForChatStatusChange = false;
                });

            // Connect Request
            // Recieves an event from the main process when the global hotkey is hit for connecting.
            listenerService.registerListener(
                { type: ListenerType.CHAT_CONNECTION_CHANGE_REQUEST },
                () => {
                    service.toggleConnectionToChat();
                });


            /**
            * Constellation Connection Stuff
            */
            service.connectedToConstellation = false;
            service.waitingForConstellationStatusChange = false;

            service.toggleConnectionToConstellation = function() {
                // Clear all reconnect timeouts if any are running.
                ipcRenderer.send('clearReconnect', "Constellation");

                if (service.connectedToConstellation === true) {
                    service.disconnectFromConstellation();
                } else if (!service.waitingForStatusChange) {
                    service.connectToConstellation();
                }
            };

            service.connectToConstellation = function() {
                // Let's connect! Get new tokens and connect.
                if (service.waitingForConstellationStatusChange) return;
                service.waitingForConstellationStatusChange = true;
                refreshToken('constellation');
            };

            service.disconnectFromConstellation = function() {
                // Disconnect!
                service.waitingForConstellationStatusChange = true;
                ipcRenderer.send('mixerConstellation', 'disconnect');
            };

            // Connection Monitor
            // Recieves event from main process that connection has been established or disconnected.
            listenerService.registerListener(
                { type: ListenerType.CONSTELLATION_CONNECTION_STATUS },
                (isConstellationConnected) => {
                    service.connectedToConstellation = isConstellationConnected;

                    if (!service.isConnectingAll) {
                        let soundType = isConstellationConnected ? "Online" : "Offline";
                        soundService.connectSound(soundType);
                    }

                    let status = isConstellationConnected ? "connected" : "disconnected";
                    $rootScope.$broadcast("connection:update", { type: "constellation", status: status });

                    service.waitingForConstellationStatusChange = false;
                });

            // Connect Request
            // Recieves an event from the main process when the global hotkey is hit for connecting.
            listenerService.registerListener(
                { type: ListenerType.CONSTELLATION_CONNECTION_CHANGE_REQUEST },
                () => {
                    service.toggleConnectionToConstellation();
                });

            return service;
        });
}());
