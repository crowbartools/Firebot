"use strict";

(function() {
    // Provides utility methods for connecting to Twitch services, overlays and integrations

    angular
        .module("firebotApp")
        .factory("connectionManager", function(
            connectionService,
            listenerService,
            settingsService,
            soundService,
            integrationService,
            logger
        ) {
            const service = {};

            let overlayStatus = listenerService.fireEventSync("getOverlayStatus");

            function delay(time) {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve();
                    }, time || 100);
                });
            }

            // Connection Monitor for Overlay
            // Recieves event from main process that connection has been established or disconnected.
            listenerService.registerListener(
                {
                    type: listenerService.ListenerType.OVERLAY_CONNECTION_STATUS
                },
                overlayStatusData => {
                    overlayStatus = overlayStatusData;
                }
            );

            service.isWaitingForServicesStatusChange = function() {
                return (
                    connectionService.waitingForStatusChange ||
                    connectionService.waitingForChatStatusChange ||
                    connectionService.isConnectingAll
                );
            };

            service.setConnectionToChat = function(shouldConnect) {
                return new Promise(resolve => {
                    listenerService.registerListener(
                        {
                            type: listenerService.ListenerType.CHAT_CONNECTION_STATUS,
                            runOnce: true
                        },
                        isChatConnected => {
                            resolve(isChatConnected);
                        }
                    );

                    if (shouldConnect) {
                        connectionService.connectToChat();
                    } else {
                        connectionService.disconnectFromChat();
                    }
                });
            };

            service.connectedServiceCount = function(services) {
                if (services == null) {
                    services = settingsService.getSidebarControlledServices();
                }

                let count = 0;

                services.forEach(s => {
                    switch (s) {
                        case "chat":
                            if (connectionService.connectedToChat) {
                                count++;
                            }
                            break;
                        default:
                            if (s.startsWith("integration.")) {
                                const intId = s.replace("integration.", "");
                                if (integrationService.integrationIsConnected(intId)) {
                                    count++;
                                }
                            }
                    }
                });

                return count;
            };

            service.partialServicesConnected = function() {
                const services = settingsService.getSidebarControlledServices();
                const connectedCount = service.connectedServiceCount();

                return connectedCount > 0 && services.length > connectedCount;
            };

            service.allServicesConnected = function() {
                const services = settingsService.getSidebarControlledServices();
                const connectedCount = service.connectedServiceCount();

                return services.length === connectedCount;
            };

            service.toggleSidebarServices = function() {
                const services = settingsService.getSidebarControlledServices();

                // we only want to connect if none of the connections are currently connected
                // otherwise we will attempt to disconnect everything.
                const shouldConnect = service.connectedServiceCount() === 0;

                service.toggleConnectionForServices(services, shouldConnect);
            };

            service.toggleConnectionForServices = async function(
                services,
                shouldConnect = false
            ) {
                if (service.isWaitingForServicesStatusChange()) {
                    return;
                }

                // Clear all reconnect timeouts if any are running.
                ipcRenderer.send("clearReconnect", "All");

                connectionService.isConnectingAll = true;

                soundService.resetPopCounter();

                for (let i = 0; i < services.length; i++) {
                    const s = services[i];
                    switch (s) {
                        case "chat":
                            if (shouldConnect) {
                                const didConnect = await service.setConnectionToChat(true);
                                if (didConnect) {
                                    soundService.popSound();
                                    await delay(100);
                                }
                            } else if (connectionService.connectedToChat) {
                                await service.setConnectionToChat(false);
                            }
                            break;
                        default:
                            if (s.startsWith("integration.")) {
                                const intId = s.replace("integration.", "");
                                logger.info(`Connecting to ${intId}`);
                                if (integrationService.integrationIsLinked(intId)) {
                                    if (shouldConnect) {
                                        const didConnect = await integrationService.setConnectionForIntegration(intId, true);
                                        if (didConnect) {
                                            soundService.popSound();
                                        }
                                    } else if (integrationService.integrationIsConnected(intId)) {
                                        await integrationService.setConnectionForIntegration(intId, false);
                                    }
                                }
                            }
                    }
                }
                connectionService.isConnectingAll = false;

                const soundType = service.connectedServiceCount() > 0 ? "Online" : "Offline";
                soundService.connectSound(soundType);
            };

            service.getConnectionStatusForService = function(service) {
                let connectionStatus = null;
                switch (service) {
                    case "chat":
                        if (connectionService.connectedToChat) {
                            connectionStatus = "connected";
                        } else {
                            connectionStatus = "disconnected";
                        }
                        break;
                    case "overlay": {
                        if (!overlayStatus.serverStarted) {
                            connectionStatus = "disconnected";
                        } else if (overlayStatus.clientsConnected) {
                            connectionStatus = "connected";
                        } else {
                            connectionStatus = "warning";
                        }

                        break;
                    }
                    case "integrations": {
                        const sidebarControlledIntegrations = settingsService
                            .getSidebarControlledServices()
                            .filter(s => s.startsWith("integration."))
                            .map(s => s.replace("integration.", ""));

                        let connectedCount = 0;
                        sidebarControlledIntegrations.forEach(i => {
                            if (integrationService.integrationIsConnected(i)) {
                                connectedCount++;
                            }
                        });

                        if (connectedCount === 0) {
                            connectionStatus = "disconnected";
                        } else if (
                            connectedCount === sidebarControlledIntegrations.length
                        ) {
                            connectionStatus = "connected";
                        } else {
                            connectionStatus = "warning";
                        }
                        break;
                    }
                    default:
                        connectionStatus = "disconnected";
                }
                return connectionStatus;
            };

            service.getOverlayStatus = function() {
                return overlayStatus;
            };

            return service;
        });
}(window.angular));
