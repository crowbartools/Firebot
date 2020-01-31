"use strict";

(function() {
    // This handles logins and connections to mixer interactive

    const dataAccess = require("../../backend/common/data-access.js");

    angular
        .module("firebotApp")
        .factory("connectionService", function(listenerService, soundService, $rootScope, backendCommunicator,
            logger, accountAccess, settingsService, utilityService) {
            let service = {};

            backendCommunicator.on("accountUpdate", accounts => {
                service.accounts = accounts;
            });
            service.getAccounts = () => {
                service.accounts = backendCommunicator.fireEventSync("getAccounts");
            };
            service.getAccounts();

            let defaultPhotoUrl = "../images/placeholders/nologin.png";

            /**
             * Login Stuff
             */

            service.getAccountAvatar = function(type) {
                if (type !== "streamer" && type !== "bot" && service.accounts[type] != null) return defaultPhotoUrl;
                return service.accounts[type].avatar || defaultPhotoUrl;
            };

            // Login Kickoff
            service.loginOrLogout = function(type) {
                if (type === "streamer") {
                    if (service.accounts.streamer.loggedIn) {
                        service.logout(type);
                    } else {
                        shell.openExternal(`http://localhost:${settingsService.getWebServerPort()}/api/v1/auth?providerId=${encodeURIComponent("mixer:streamer-account")}`);
                    }
                } else if (type === "bot") {
                    if (service.accounts.bot.loggedIn) {
                        service.logout(type);
                    } else {
                        utilityService.showModal({
                            component: "botLoginModal",
                            size: 'sm'
                        });
                    }
                }
            };

            service.logout = (type) => {
                if (type !== "streamer" && type !== "bot") return;
                if (service.accounts[type].loggedIn) {
                    accountAccess.logoutAccount(type);
                }
            };

            // Create new profile
            service.createNewProfile = function(profileId) {
                ipcRenderer.send("createProfile", profileId);
            };

            service.renameProfile = function(newProfileId) {
                ipcRenderer.send("renameProfile", newProfileId);
            };

            // delete profile
            service.deleteProfile = function() {
                ipcRenderer.send("deleteProfile");
            };

            // switch profile
            service.switchProfiles = function(profileId) {
                ipcRenderer.send("switchProfile", profileId);
            };

            service.profiles = [];
            //load profiles
            service.loadProfiles = () => {
                // Get full list of active profiles.

                let activeProfileIds;
                try {
                    let globalSettingDb = dataAccess.getJsonDbInUserData("./global-settings");
                    activeProfileIds = globalSettingDb.getData("./profiles/activeProfiles");
                } catch (err) {
                    logger.warn("Couldnt load active profiles.");
                    return;
                }

                if (activeProfileIds == null) return;

                let profiles = [];
                for (let profileId of activeProfileIds) {
                    let profile = {
                        username: "User",
                        avatar: defaultPhotoUrl,
                        profileId: profileId
                    };

                    // Try to get streamer settings for this profile.
                    // If it exists, overwrite defaults.
                    let streamer;
                    try {
                        let profileDb = dataAccess.getJsonDbInUserData("./profiles/" + profileId + "/auth");
                        streamer = profileDb.getData("/streamer");
                    } catch (err) {
                        logger.info("Couldnt get streamer data for profile " + profileId + " while updating the UI. Its possible this account hasnt logged in yet.");
                    }

                    if (streamer) {
                        if (streamer.username) {
                            profile.username = streamer.username;
                        }
                        if (streamer.avatar) {
                            profile.avatar = streamer.avatar;
                        }
                    }

                    profiles.push(profile);
                }

                service.profiles = profiles;
            };

            /**
             * CONNECTION LISTENERS
             */

            service.isConnectingAll = false;

            service.connectedToInteractive = false;
            service.waitingForStatusChange = false;
            service.connectedBoard = "";

            service.toggleConnectionToInteractive = function() {
                // Clear all reconnect timeouts if any are running.
                ipcRenderer.send("clearReconnect", "Interactive");

                if (service.connectedToInteractive === true) {
                    service.disconnectFromInteractive();
                } else if (!service.waitingForChatStatusChange) {
                    service.connectToInteractive();
                }
            };

            service.connectToInteractive = function() {
                // Let's connect! Get new tokens and connect.
                if (service.waitingForStatusChange) return false;

                service.waitingForStatusChange = true;

                ipcRenderer.send('gotRefreshToken');
            };

            service.disconnectFromInteractive = function() {
                // Disconnect!
                service.waitingForStatusChange = true;
                ipcRenderer.send("mixerInteractive", "disconnect");
            };

            let ListenerType = listenerService.ListenerType;

            // Connection Monitor
            // Recieves event from main process that connection has been established or disconnected.
            listenerService.registerListener(
                { type: ListenerType.CONNECTION_STATUS },
                isConnected => {
                    service.connectedToInteractive = isConnected;

                    if (!service.isConnectingAll) {
                        let soundType = isConnected ? "Online" : "Offline";
                        soundService.connectSound(soundType);
                    }

                    let status = isConnected ? "connected" : "disconnected";
                    $rootScope.$broadcast("connection:update", {
                        type: "interactive",
                        status: status
                    });

                    service.waitingForStatusChange = false;
                }
            );

            // Connect Request
            // Recieves an event from the main process when the global hotkey is hit for connecting.
            listenerService.registerListener(
                { type: ListenerType.CONNECTION_CHANGE_REQUEST },
                () => {
                    service.toggleConnectionToInteractive();
                }
            );

            /**
       * Chat Connection Stuff
       */
            service.connectedToChat = false;
            service.waitingForChatStatusChange = false;

            service.toggleConnectionToChat = function() {
                // Clear all reconnect timeouts if any are running.
                ipcRenderer.send("clearReconnect", "Chat");

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
                ipcRenderer.send('gotChatRefreshToken');
            };

            service.disconnectFromChat = function() {
                // Disconnect!
                service.waitingForChatStatusChange = true;
                ipcRenderer.send("mixerChat", "disconnect");
            };

            // Connection Monitor
            // Recieves event from main process that connection has been established or disconnected.
            listenerService.registerListener(
                { type: ListenerType.CHAT_CONNECTION_STATUS },
                isChatConnected => {
                    service.connectedToChat = isChatConnected;

                    if (!service.isConnectingAll) {
                        let soundType = isChatConnected ? "Online" : "Offline";
                        soundService.connectSound(soundType);
                    }

                    let status = isChatConnected ? "connected" : "disconnected";
                    $rootScope.$broadcast("connection:update", {
                        type: "chat",
                        status: status
                    });

                    service.waitingForChatStatusChange = false;
                }
            );

            // Connect Request
            // Recieves an event from the main process when the global hotkey is hit for connecting.
            listenerService.registerListener(
                { type: ListenerType.CHAT_CONNECTION_CHANGE_REQUEST },
                () => {
                    service.toggleConnectionToChat();
                }
            );

            /**
       * Constellation Connection Stuff
       */
            service.connectedToConstellation = false;
            service.waitingForConstellationStatusChange = false;

            service.toggleConnectionToConstellation = function() {
                // Clear all reconnect timeouts if any are running.
                ipcRenderer.send("clearReconnect", "Constellation");

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
                ipcRenderer.send('gotConstellationRefreshToken');
            };

            service.disconnectFromConstellation = function() {
                // Disconnect!
                service.waitingForConstellationStatusChange = true;
                ipcRenderer.send("mixerConstellation", "disconnect");
            };

            // Connection Monitor
            // Recieves event from main process that connection has been established or disconnected.
            listenerService.registerListener(
                { type: ListenerType.CONSTELLATION_CONNECTION_STATUS },
                isConstellationConnected => {
                    service.connectedToConstellation = isConstellationConnected;

                    if (!service.isConnectingAll) {
                        let soundType = isConstellationConnected ? "Online" : "Offline";
                        soundService.connectSound(soundType);
                    }

                    let status = isConstellationConnected ? "connected" : "disconnected";
                    $rootScope.$broadcast("connection:update", {
                        type: "constellation",
                        status: status
                    });

                    service.waitingForConstellationStatusChange = false;
                }
            );

            // Connect Request
            // Recieves an event from the main process when the global hotkey is hit for connecting.
            listenerService.registerListener(
                { type: ListenerType.CONSTELLATION_CONNECTION_CHANGE_REQUEST },
                () => {
                    service.toggleConnectionToConstellation();
                }
            );

            // Connection Monitor for Overlay
            // Recieves event from main process that connection has been established or disconnected.
            listenerService.registerListener(
                { type: ListenerType.OVERLAY_CONNECTION_STATUS },
                overlayStatusData => {
                    let status;
                    if (!overlayStatusData.serverStarted) {
                        status = "disconnected";
                    } else if (overlayStatusData.clientsConnected) {
                        status = "connected";
                    } else {
                        status = "warning";
                    }

                    $rootScope.$broadcast("connection:update", {
                        type: "overlay",
                        status: status
                    });
                }
            );

            return service;
        });
}());
