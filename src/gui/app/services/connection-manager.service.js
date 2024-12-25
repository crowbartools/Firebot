"use strict";

(function() {
    // Provides utility methods for connecting to Twitch services, overlays and integrations

    angular
        .module("firebotApp")
        .factory("connectionManager", function(
            connectionService,
            backendCommunicator,
            settingsService,
            integrationService
        ) {
            const service = {};

            let overlayStatus = backendCommunicator.fireEventSync("getOverlayStatus");

            // Connection Monitor for Overlay
            // Recieves event from main process that connection has been established or disconnected.
            backendCommunicator.on("overlayStatusUpdate", (overlayStatusData) => {
                overlayStatus = overlayStatusData;
            });

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

            service.getOverlayStatus = function() {
                return overlayStatus;
            };

            return service;
        });
}(window.angular));
