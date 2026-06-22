"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("connectionService", function(
            soundService,
            $rootScope,
            backendCommunicator,
            logger,
            settingsService,
            utilityService,
            integrationService
        ) {
            const service = {};

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
                backendCommunicator.send("connections:connect-sidebar-controlled-services");
            };
            service.disconnectSidebarControlledServices = () => backendCommunicator.send("connections:disconnect-sidebar-controlled-services");
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

            service.getConnectionStatusForService = function(serviceId) {
                let connectionStatus = null;
                switch (serviceId) {
                    case "overlay": {
                        return service.connections["overlay"];
                    }
                    case "chat":
                        if (service.connectedToChat) {
                            connectionStatus = "connected";
                        } else {
                            connectionStatus = "disconnected";
                        }
                        break;
                    case "integrations": {
                        const sidebarControlledIntegrations = settingsService
                            .getSetting("SidebarControlledServices")
                            .filter(s => s.startsWith("integration."))
                            .map(s => s.replace("integration.", ""));

                        let connectedCount = 0;
                        sidebarControlledIntegrations.forEach((i) => {
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

            let overlayStatus = {};
            service.getOverlayStatus = function() {
                return overlayStatus;
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

            backendCommunicator.on("connections:service-connection-update", (data) => {
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

            backendCommunicator.on("connections:updated-all-service-connections", (data) => {
                for (const serviceInfo of data) {
                    /**@type {string} */
                    const serviceId = serviceInfo.serviceId;
                    /**@type {ConnectionState} */
                    const connectionState = serviceInfo.connectionState;

                    //see if there has been no change
                    if (service.connections[serviceId] === connectionState) {
                        continue;
                    }

                    service.connections[serviceId] = connectionState;

                    $rootScope.$broadcast("connection:update", {
                        type: serviceInfo.serviceId,
                        status: serviceInfo.connectionState
                    });
                }

                updateSidebarServicesOverallStatus();
                updateIntegrationsOverallStatus();
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

            // Connection Monitor for Overlay
            // Recieves event from main process that connection has been established or disconnected.
            backendCommunicator.on("http-server:overlay-status-update", (overlayStatusData) => {
                overlayStatus = overlayStatusData;

                let status;
                if (!overlayStatus.serverStarted) {
                    status = "disconnected";
                } else if (overlayStatus.clientsConnected) {
                    status = "connected";
                } else {
                    status = "warning";
                }

                service.connections["overlay"] = status;

                $rootScope.$broadcast("connection:update", {
                    type: "overlay",
                    status: status
                });
            });

            backendCommunicator.send("connections:ui-service-ready");

            return service;
        });
}());