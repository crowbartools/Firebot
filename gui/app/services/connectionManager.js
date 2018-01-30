'use strict';


(function() {

    // Provides utility methods for connecting to mixer services

    angular
        .module('firebotApp')
        .factory('connectionManager', function (connectionService, listenerService, settingsService, websocketService,
            soundService, boardService, utilityService) {

            let service = {};

            // listen for toggle service requests from the backend
            listenerService.registerListener(
                { type: listenerService.ListenerType.TOGGLE_SERVICES_REQUEST },
                (services) => {
                    if (service.isWaitingForServicesStatusChange()) return;
                    let shouldConnect = service.connectedServiceCount(services) === 0;
                    service.toggleConnectionForServices(services, shouldConnect);
                });

            service.isWaitingForServicesStatusChange = function() {
                return (connectionService.waitingForStatusChange || connectionService.waitingForChatStatusChange ||
                    connectionService.waitingForConstellationStatusChange || connectionService.isConnectingAll);
            };

            service.setConnectionToChat = function(shouldConnect) {
                return new Promise(resolve => {
                    listenerService.registerListener(
                        { type: listenerService.ListenerType.CHAT_CONNECTION_STATUS,
                            runOnce: true },
                        (isChatConnected) => {
                            resolve(isChatConnected);
                        });

                    if (shouldConnect) {
                        connectionService.connectToChat();
                    } else {
                        connectionService.disconnectFromChat();
                    }
                });
            };

            service.setConnectionToConstellation = function(shouldConnect) {
                return new Promise(resolve => {
                    listenerService.registerListener(
                        { type: listenerService.ListenerType.CONSTELLATION_CONNECTION_STATUS,
                            runOnce: true },
                        (isConstellationConnected) => {
                            resolve(isConstellationConnected);
                        });

                    if (shouldConnect) {
                        connectionService.connectToConstellation();
                    } else {
                        connectionService.disconnectFromConstellation();
                    }
                });
            };

            service.setConnectionToInteractive = function(shouldConnect) {
                return new Promise(resolve => {

                    if (!boardService.hasBoardsLoaded()) {
                        utilityService.showInfoModal("Interactive will not connect as you do not have any boards loaded. If you do not plan to use Interactive right now, you can disable it's use by the sidebar connection button via the Connection Panel.");
                        resolve(false);
                        return;
                    }

                    listenerService.registerListener(
                        { type: listenerService.ListenerType.CONNECTION_STATUS,
                            runOnce: true },
                        (isInteractiveConnected) => {
                            resolve(isInteractiveConnected);
                        });

                    if (shouldConnect) {
                        connectionService.connectToInteractive();
                    } else {
                        connectionService.disconnectFromInteractive();
                    }

                });
            };

            service.connectedServiceCount = function(services) {
                if (services == null) {
                    services = settingsService.getSidebarControlledServices();
                }

                let count = 0;

                services.forEach((s) => {
                    switch (s) {
                    case 'interactive':
                        if (connectionService.connectedToInteractive) {
                            count++;
                        }
                        break;
                    case 'chat':
                        if (connectionService.connectedToChat) {
                            count++;
                        }
                        break;
                    case 'constellation':
                        if (connectionService.connectedToConstellation) {
                            count++;
                        }
                        break;
                    }
                });

                return count;
            };

            service.partialServicesConnected = function() {
                let services = settingsService.getSidebarControlledServices();
                let connectedCount = service.connectedServiceCount();

                return (connectedCount > 0 && services.length > connectedCount);
            };

            service.allServicesConnected = function() {
                let services = settingsService.getSidebarControlledServices();
                let connectedCount = service.connectedServiceCount();

                return (services.length === connectedCount);
            };

            service.toggleSidebarServices = function () {

                let services = settingsService.getSidebarControlledServices();

                // we only want to connect if none of the connections are currently connected
                // otherwise we will attempt to disconnect everything.
                let shouldConnect = service.connectedServiceCount() === 0;

                service.toggleConnectionForServices(services, shouldConnect);
            };

            service.toggleConnectionForServices = async function(services, shouldConnect = false) {

                if (service.isWaitingForServicesStatusChange()) return;

                // Clear all reconnect timeouts if any are running.
                ipcRenderer.send('clearReconnect', "All");

                connectionService.isConnectingAll = true;

                for (let i = 0; i < services.length; i++) {
                    let s = services[i];
                    switch (s) {
                    case 'interactive':
                        if (shouldConnect) {
                            await service.setConnectionToInteractive(true);
                        } else if (connectionService.connectedToInteractive) {
                            await service.setConnectionToInteractive(false);
                        }
                        break;
                    case 'chat':
                        if (shouldConnect) {
                            await service.setConnectionToChat(true);
                        } else if (connectionService.connectedToChat) {
                            await service.setConnectionToChat(false);
                        }
                        break;
                    case 'constellation':
                        if (shouldConnect) {
                            await service.setConnectionToConstellation(true);
                        } else if (connectionService.connectedToConstellation) {
                            await service.setConnectionToConstellation(false);
                        }
                        break;
                    }
                }
                connectionService.isConnectingAll = false;

                let soundType = service.connectedServiceCount() > 0 ? "Online" : "Offline";
                soundService.connectSound(soundType);
            };

            service.getConnectionStatusForService = function(service) {
                let connectionStatus = null;
                switch (service) {
                case "interactive":
                    if (connectionService.connectedToInteractive) {
                        connectionStatus = "connected";
                    } else {
                        connectionStatus = "disconnected";
                    }
                    break;
                case "chat":
                    if (connectionService.connectedToChat) {
                        connectionStatus = "connected";
                    } else {
                        connectionStatus = "disconnected";
                    }
                    break;
                case "constellation":
                    if (connectionService.connectedToConstellation) {
                        connectionStatus = "connected";
                    } else {
                        connectionStatus = "disconnected";
                    }
                    break;
                case "overlay":
                    if (websocketService.hasClientsConnected) {
                        connectionStatus = "connected";
                    } else {
                        connectionStatus = "warning";
                    }
                    break;
                }
                return connectionStatus;
            };

            return service;
        });
}(window.angular));
