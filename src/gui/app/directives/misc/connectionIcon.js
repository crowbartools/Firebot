"use strict";

(function() {
    angular.module("firebotApp").component("connectionIcon", {
        bindings: {
            type: "@"
        },
        template: `
      <span class="connection-icon" uib-tooltip-html="$ctrl.tooltip" tooltip-append-to-body="true" tooltip-placement="top-left">
          <i ng-class="$ctrl.connectionIcon"></i>
          <span class="status-bubble" ng-class="$ctrl.bubbleClass">
              <i class="fas" ng-class="$ctrl.bubbleIconClass"></i>
          </span>
      </span>
      `,
        controller: function(
            $rootScope,
            $timeout,
            connectionManager,
            connectionService,
            integrationService
        ) {
            const ctrl = this;

            ctrl.connectionIcon = "";
            ctrl.connectionStatus = ""; // connected, disconnected, warning
            ctrl.bubbleClass = "";
            ctrl.bubbleIconClass = "";
            ctrl.tooltip = "";

            const ConnectionType = {
                CHAT: "chat",
                OVERLAY: "overlay",
                INTEGRATIONS: "integrations"
            };

            const ConnectionStatus = {
                CONNECTED: "connected",
                DISCONNECTED: "disconnected",
                WARNING: "warning"
            };

            const ConnectionIcon = {
                CHAT: "fab fa-twitch",
                OVERLAY: "fas fa-tv-retro",
                INTEGRATIONS: "fas fa-globe"
            };

            const BubbleIcon = {
                CONNECTED: "fa-check",
                DISCONNECTED: "fa-times",
                WARNING: "fa-exclamation"
            };

            function setBubbleClasses() {
                const connectionStatus = ctrl.connectionStatus;

                ctrl.bubbleClass = `${connectionStatus} animated bounceIn`;

                $timeout(() => {
                    ctrl.bubbleClass = ctrl.bubbleClass.replace(" animated bounceIn", "");
                }, 1000);

                switch (connectionStatus) {
                    case ConnectionStatus.CONNECTED:
                        ctrl.bubbleIconClass = BubbleIcon.CONNECTED;
                        break;
                    case ConnectionStatus.DISCONNECTED:
                        ctrl.bubbleIconClass = BubbleIcon.DISCONNECTED;
                        break;
                    case ConnectionStatus.WARNING:
                        ctrl.bubbleIconClass = BubbleIcon.WARNING;
                        break;
                }
            }

            function generateTooltip() {
                let integrations,
                    intTooltip = "",
                    count = 0;

                switch (ctrl.type) {
                    case ConnectionType.CHAT:
                        if (ctrl.connectionStatus === ConnectionStatus.CONNECTED) {
                            ctrl.tooltip = "<b>Twitch:</b> Connected";
                        } else {
                            ctrl.tooltip = "<b>Twitch:</b> Disconnected";
                        }
                        break;

                    case ConnectionType.OVERLAY:
                        if (ctrl.connectionStatus === ConnectionStatus.CONNECTED) {
                            ctrl.tooltip = "<b>Overlay:</b> Connected";
                        } else if (ctrl.connectionStatus === ConnectionStatus.WARNING) {
                            ctrl.tooltip = "<b>Overlay:</b> Ready, but nothing is connected at this time.";
                        } else {
                            ctrl.tooltip = "<b>Overlay:</b> Error starting web server. App restart required.";
                        }
                        break;

                    case ConnectionType.INTEGRATIONS:
                        if (ctrl.connectionStatus === ConnectionStatus.CONNECTED) {
                            ctrl.tooltip = "<b>Overlay:</b> Connected";
                        } else if (ctrl.connectionStatus === ConnectionStatus.WARNING) {
                            ctrl.tooltip = "<b>Overlay:</b> Running, but nothing connected";
                        } else {
                            ctrl.tooltip = "<b>Overlay:</b> Error starting web server. App restart required.";
                        }
                        integrations = integrationService
                            .getIntegrations()
                            .filter(i => i.linked && i.connectionToggle);


                        integrations.forEach(i => {
                            if (count !== 0) {
                                intTooltip += "<br/>";
                            }
                            const connectionStatus = i.connected ? "Connected" : "Disconnected";
                            intTooltip += `<b>${i.name}</b>: ${connectionStatus}`;
                            count++;
                        });

                        ctrl.tooltip = intTooltip;
                        break;
                    default:
                        return "";
                }
            }

            $rootScope.$on("connection:update", (event, data) => {
                if (ctrl.type === ConnectionType.INTEGRATIONS) {
                    if (!data.type.startsWith("integration.")) {
                        return;
                    }
                } else if (data.type !== ctrl.type) {
                    return;
                }

                let shouldUpdate = false;
                if (data.type === "overlay") {
                    ctrl.connectionStatus = data.status;
                    shouldUpdate = true;
                } else if (data.type.startsWith("integration.")) {
                    ctrl.connectionStatus = connectionService.integrationsOverallStatus;
                    shouldUpdate = true;
                } else if (data.status === ConnectionStatus.CONNECTED || data.status === ConnectionStatus.DISCONNECTED) {
                    ctrl.connectionStatus = data.status;
                    console.log(`Set status "${ctrl.connectionStatus}" for connection type "${ctrl.type}"`);
                    shouldUpdate = true;
                }

                if (shouldUpdate) {
                    setBubbleClasses();
                    generateTooltip();
                }
            });

            ctrl.$onInit = function() {
                switch (ctrl.type) {
                    case ConnectionType.CHAT:
                        ctrl.connectionIcon = ConnectionIcon.CHAT;
                        break;
                    case ConnectionType.OVERLAY:
                        ctrl.connectionIcon = ConnectionIcon.OVERLAY;
                        break;
                    case ConnectionType.INTEGRATIONS:
                        ctrl.connectionIcon = ConnectionIcon.INTEGRATIONS;
                }

                if (ctrl.type === ConnectionType.OVERLAY) {
                    ctrl.connectionStatus = connectionManager.getConnectionStatusForService("overlay");
                } else {
                    ctrl.connectionStatus = "disconnected";
                }

                setBubbleClasses();
                generateTooltip();
            };
        }
    });
}());
