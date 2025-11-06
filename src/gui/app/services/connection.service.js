"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("connectionService", function(
            soundService,
            $rootScope,
            backendCommunicator,
            logger,
            accountAccess,
            profileManager,
            settingsService,
            utilityService,
            integrationService
        ) {
            const service = {};

            backendCommunicator.on("accounts:account-update", (accounts) => {
                service.accounts = accounts;
                service.loadProfiles();
            });
            service.loadAccounts = () => {
                service.accounts = backendCommunicator.fireEventSync("accounts:get-accounts");
            };
            service.loadAccounts();

            const defaultPhotoUrl = "../images/placeholders/nologin.png";

            /**
             * Login Stuff
             */

            service.getAccountAvatar = function(type) {
                if (type !== "streamer" && type !== "bot" && service.accounts[type] != null) {
                    return defaultPhotoUrl;
                }

                return service.accounts[type].avatar || defaultPhotoUrl;
            };

            // Login Kickoff
            service.loginOrLogout = function(type) {
                if (type === "streamer") {
                    if (service.accounts.streamer.loggedIn) {
                        service.logout(type);
                    } else {
                        utilityService.showModal({
                            component: "twitchDcfModal",
                            resolveObj: {
                                accountType: () => type
                            },
                            closeCallback: () => {
                                backendCommunicator.send("cancel-device-token-check");
                            }
                        });
                    }
                } else if (type === "bot") {
                    if (service.accounts.bot.loggedIn) {
                        service.logout(type);
                    } else {
                        utilityService.showModal({
                            component: "twitchDcfModal",
                            resolveObj: {
                                accountType: () => type
                            },
                            closeCallback: () => {
                                backendCommunicator.send("cancel-device-token-check");
                            }
                        });
                    }
                }
            };

            service.logout = (type) => {
                if (type !== "streamer" && type !== "bot") {
                    return;
                }

                if (service.accounts[type].loggedIn) {
                    accountAccess.logoutAccount(type);
                }
            };

            service.invalidateAccounts = (invalidAccounts) => {
                if (!invalidAccounts.streamer && !invalidAccounts.bot) {
                    return;
                }

                service.disconnectFromService("chat");

                if (invalidAccounts.streamer) {
                    service.logout("streamer");
                }

                if (invalidAccounts.bot) {
                    service.logout("bot");
                }

                utilityService.showModal({
                    component: "loginsModal",
                    resolveObj: {
                        invalidAccounts: () => invalidAccounts
                    }
                });
            };

            backendCommunicator.on("accounts:invalidate-accounts", service.invalidateAccounts);

            service.validateAccounts = () => {
                backendCommunicator.fireEventSync("validate-twitch-accounts");
            };

            // Create new profile
            service.createNewProfile = (profileId) => {
                backendCommunicator.send("profiles:create-profile", profileId);
            };

            service.renameProfile = (newProfileId) => {
                backendCommunicator.send("profiles:rename-profile", newProfileId);
            };

            // delete profile
            service.deleteProfile = () => {
                backendCommunicator.send("profiles:delete-profile");
            };

            // switch profile
            service.switchProfiles = (profileId) => {
                backendCommunicator.send("profiles:switch-profile", profileId);
            };

            service.profiles = [];
            //load profiles
            service.loadProfiles = () => {
                // Get full list of active profiles.

                const activeProfileIds = profileManager.getActiveProfiles();

                if (activeProfileIds == null) {
                    return;
                }

                const profiles = [];
                for (const profileId of activeProfileIds) {
                    const profile = {
                        username: "User",
                        avatar: defaultPhotoUrl,
                        profileId: profileId
                    };

                    // Try to get streamer settings for this profile.
                    // If it exists, overwrite defaults.
                    const streamer = profileManager.getAccountInfo(profileId, "streamer");

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

            service.isConnectingAll = false;

            /*
             * NEW CONNECTION HANDLING
             */

            /**
             * Each connection state
             * @readonly
             * @enum {string}
             */
            const ConnectionState = Object.freeze({
                Connected: "connected",
                Disconnected: "disconnected",
                Connecting: "connecting",
                Reconnecting: "reconnecting"
            });

            service.connections = {
                chat: ConnectionState.Disconnected
            };

            // this can be 'disconnected', 'partial', or 'connected'
            service.sidebarServicesOverallStatus = 'disconnected';
            function updateSidebarServicesOverallStatus() {
                let oneDisconnected = false;
                let oneConnected = false;
                const serviceIds = settingsService.getSetting("SidebarControlledServices");
                for (const serviceId of serviceIds) {

                    if (serviceId == null || (serviceId !== "chat" && !serviceId.startsWith("integration."))) {
                        continue;
                    }

                    if (service.connections[serviceId] === ConnectionState.Connected) {
                        oneConnected = true;
                    } else {
                        oneDisconnected = true;
                    }
                }
                if (oneDisconnected) {
                    service.sidebarServicesOverallStatus = oneConnected ? 'partial' : 'disconnected';
                } else {
                    service.sidebarServicesOverallStatus = 'connected';
                }
                logger.debug(`Set overall sidebar service status to "${service.sidebarServicesOverallStatus}"`);
            }

            // this can be 'disconnected', connected'
            service.integrationsOverallStatus = ConnectionState.Disconnected;
            function updateIntegrationsOverallStatus() {
                let oneDisconnected = false;
                for (const integration of integrationService.getLinkedIntegrations()) {
                    const intServiceId = `integration.${integration.id}`;
                    if (service.connections[intServiceId] !== ConnectionState.Connected) {
                        oneDisconnected = true;
                        break;
                    }
                }
                if (oneDisconnected) {
                    service.integrationsOverallStatus = 'disconnected';
                } else {
                    service.integrationsOverallStatus = 'connected';
                }
            }

            for (const integration of integrationService.getLinkedIntegrations()) {
                const intServiceId = `integration.${integration.id}`;
                service.connections[intServiceId] = ConnectionState.Disconnected;
            }

            service.ConnectionState = ConnectionState;

            service.connectToService = function(serviceId) {
                backendCommunicator.send("connect-service", serviceId);
            };

            service.disconnectFromService = function(serviceId) {
                backendCommunicator.send("disconnect-service", serviceId);
            };

            service.toggleConnectionToService = function(serviceId) {
                if (service.connections[serviceId] == null) {
                    return;
                }

                if (service.connections[serviceId] === 'connected') {
                    service.disconnectFromService(serviceId);
                } else {
                    service.connectToService(serviceId);
                }
            };

            service.connectSidebarControlledServices = () => {
                service.isConnectingAll = true;
                backendCommunicator.send("connect-sidebar-controlled-services");
            };
            service.disconnectSidebarControlledServices = () => backendCommunicator.send("disconnect-sidebar-controlled-services");
            service.toggleSidebarControlledServices = () => {
                if (service.isConnectingAll) {
                    return;
                }

                if (service.sidebarServicesOverallStatus === 'disconnected') {
                    soundService.resetPopCounter();
                    service.connectSidebarControlledServices();
                    logger.debug("Triggering connection of all sidebar controlled services");
                } else {
                    service.disconnectSidebarControlledServices();
                    logger.debug("Triggering disconnection of all sidebar controlled services");
                }
            };

            backendCommunicator.on("connect-services-complete", () => {
                service.isConnectingAll = false;
                if (service.sidebarServicesOverallStatus === 'disconnected') {
                    soundService.connectSound("Offline");
                } else {
                    soundService.connectSound("Online");
                }
            });

            backendCommunicator.on("toggle-connections-started", () => {
                soundService.resetPopCounter();
                service.isConnectingAll = true;
            });

            const playConnectionStatusSound = utilityService.debounce((connectionState) => {
                const soundType = connectionState === ConnectionState.Connected ? "Online" : "Offline";
                soundService.connectSound(soundType);
            }, 250);

            backendCommunicator.on("service-connection-update", (data) => {
                /**@type {string} */
                const serviceId = data.serviceId;
                /**@type {ConnectionState} */
                const connectionState = data.connectionState;

                //see if there has been no change
                if (service.connections[serviceId] === connectionState) {
                    return;
                }

                if (connectionState === ConnectionState.Connected || connectionState === ConnectionState.Disconnected) {
                    if (!service.isConnectingAll) {
                        playConnectionStatusSound(connectionState);
                    } else {
                        if (connectionState === ConnectionState.Connected) {
                            soundService.popSound();
                        }
                    }
                }

                service.connections[serviceId] = connectionState;

                updateSidebarServicesOverallStatus();

                if (serviceId.startsWith("integration.")) {
                    updateIntegrationsOverallStatus();
                }

                $rootScope.$broadcast("connection:update", {
                    type: serviceId,
                    status: connectionState
                });
            });

            backendCommunicator.on("integrationLinked", (integration) => {
                if (integration == null || !integration.connectionToggle) {
                    return;
                }
                const serviceId = `integration.${integration.id}`;
                service.connections[serviceId] = ConnectionState.Disconnected;
            });

            backendCommunicator.on("integrationUnlinked", (intId) => {
                const serviceId = `integration.${intId}`;
                delete service.connections[serviceId];
            });


            /*
             * OLD CONNECTION STUFF. TODO: Delete
             */
            service.connectedBoard = "";

            // Connection Monitor for Overlay
            // Recieves event from main process that connection has been established or disconnected.
            backendCommunicator.on("overlayStatusUpdate", (overlayStatusData) => {
                let status;
                if (!overlayStatusData.serverStarted) {
                    status = "disconnected";
                } else if (overlayStatusData.clientsConnected) {
                    status = "connected";
                } else {
                    status = "warning";
                }

                service.connections["overlay"] = status;

                $rootScope.$broadcast("connection:update", {
                    type: "overlay",
                    status: status
                });
            }
            );

            return service;
        });
}());