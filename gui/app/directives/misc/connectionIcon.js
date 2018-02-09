'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("connectionIcon", {
            bindings: {
                type: "@"
            },
            template: `
            <span class="connection-icon" uib-tooltip-html="$ctrl.tooltip" tooltip-append-to-body="true" tooltip-placement="top-left">
                <i class="fas" ng-class="$ctrl.connectionIcon"></i>
                <span class="status-bubble" ng-class="$ctrl.bubbleClass">
                    <i class="fas" ng-class="$ctrl.bubbleIconClass"></i>
                </span>
            </span>
            `,
            controller: function($rootScope, $timeout, connectionManager, connectionService) {
                let ctrl = this;

                ctrl.connectionIcon = "";
                ctrl.connectionStatus = ""; // connected, disconnected, warning
                ctrl.bubbleClass = "";
                ctrl.bubbleIconClass = "";
                ctrl.tooltip = "";

                const ConnectionType = {
                    INTERACTIVE: "interactive",
                    CHAT: "chat",
                    CONSTELLATION: "constellation",
                    OVERLAY: "overlay"
                };

                const ConnectionStatus = {
                    CONNECTED: "connected",
                    DISCONNECTED: "disconnected",
                    WARNING: "warning"
                };

                const ConnectionIcon = {
                    INTERACTIVE: "fa-gamepad",
                    CHAT: "fa-comment",
                    CONSTELLATION: "fa-rocket",
                    OVERLAY: "fa-tv-retro"
                };

                const BubbleIcon = {
                    CONNECTED: "fa-plug",
                    DISCONNECTED: "fa-plug",
                    WARNING: "fa-exclamation"
                };

                function setBubbleClasses() {
                    let connectionStatus = ctrl.connectionStatus;

                    ctrl.bubbleClass = connectionStatus + " animated bounceIn";

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
                    switch (ctrl.type) {
                    case ConnectionType.INTERACTIVE:
                        if (ctrl.connectionStatus === ConnectionStatus.CONNECTED) {
                            ctrl.tooltip = "<b>Interactive:</b> Connected";
                            let connectedBoard = connectionService.connectedBoard;
                            if (connectedBoard !== "") {
                                ctrl.tooltip += "<br/>(" + connectedBoard + ")";
                            }
                        } else {
                            ctrl.tooltip = "<b>Interactive:</b> Disconnected";
                        }
                        break;
                    case ConnectionType.CHAT:
                        if (ctrl.connectionStatus === ConnectionStatus.CONNECTED) {
                            ctrl.tooltip = "<b>Chat:</b> Connected";
                        } else {
                            ctrl.tooltip = "<b>Chat:</b> Disconnected";
                        }
                        break;
                    case ConnectionType.CONSTELLATION:
                        if (ctrl.connectionStatus === ConnectionStatus.CONNECTED) {
                            ctrl.tooltip = "<b>Constellation:</b> Connected";
                        } else {
                            ctrl.tooltip = "<b>Constellation:</b> Disconnected";
                        }
                        break;
                    case ConnectionType.OVERLAY:
                        if (ctrl.connectionStatus === ConnectionStatus.CONNECTED) {
                            ctrl.tooltip = "<b>Overlay:</b> Connected";
                        } else {
                            ctrl.tooltip = "<b>Overlay:</b> Running, but nothing connected";
                        }
                        break;
                    }
                }

                $rootScope.$on("connection:update", (event, data) => {
                    if (data.type !== ctrl.type) return;

                    ctrl.connectionStatus = data.status;
                    setBubbleClasses();
                    generateTooltip();
                });


                ctrl.$onInit = function() {

                    switch (ctrl.type) {
                    case ConnectionType.INTERACTIVE:
                        ctrl.connectionIcon = ConnectionIcon.INTERACTIVE;
                        break;
                    case ConnectionType.CHAT:
                        ctrl.connectionIcon = ConnectionIcon.CHAT;
                        break;
                    case ConnectionType.CONSTELLATION:
                        ctrl.connectionIcon = ConnectionIcon.CONSTELLATION;
                        break;
                    case ConnectionType.OVERLAY:
                        ctrl.connectionIcon = ConnectionIcon.OVERLAY;
                        break;
                    }

                    ctrl.connectionStatus = connectionManager.getConnectionStatusForService(ctrl.type);
                    setBubbleClasses();
                    generateTooltip();
                };
            }
        });
}());