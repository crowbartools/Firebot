"use strict";
//
(function() {
    angular.module("firebotApp").component("connectionPanelModal", {
        template: `
            <div class="modal-header" style="text-align: center">
                <h4 class="modal-title">Connection Panel</h4>
            </div>
            <div class="modal-body" style="padding-bottom: 30px;">
                <div style="display: flex;justify-content: space-around">
                <div>
                    <div style="text-align: center;font-size: 18px;color: gray;font-weight: 100;padding-bottom: 15px;">
                        TWITCH
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-around; width: 100%;">
                        <div class="connection-tile">
                            <span class="connection-title">Chat & Events <tooltip text="'Used for commands, chat effects, chat feed, events, etc.'"></tooltip></span>
                            <connection-button
                                connected="$ctrl.conn.connections['chat'] === 'connected'"
                                connecting="$ctrl.conn.connections['chat'] === 'connecting'"
                                connection-name="Chat"
                                on-connection-click="$ctrl.conn.toggleConnectionToService('chat')"></connection-button>
                            <div class="sub-title">
                                <div style="padding-bottom: 4px;">Sidebar controlled <tooltip text="'Check this to have Chat be controlled by the sidebar connect button.'"></tooltip></div>
                                <label class="control-fb control--checkbox" style="position: relative;height: 20px;padding: 0;margin: 0;width: 20px;">
                                    <input type="checkbox" ng-checked="$ctrl.serviceIsChecked('chat')" ng-click="$ctrl.toggledServiceIsChecked('chat')">
                                    <div class="control__indicator"></div>
                                </label>
                            </div>
                        </div>

                    </div>
                </div>
                <div>
                    <div style="text-align: center;font-size: 18px;color: gray;font-weight: 100;padding-bottom: 15px;">
                        FIREBOT
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-around; width: 100%;">
                        <div class="connection-tile">
                            <span class="connection-title">Overlay</span>
                            <div class="overlay-button" ng-class="{ 'connected': $ctrl.getOverlayStatusId() == 1, 'warning': $ctrl.getOverlayStatusId() == 0,'disconnected': $ctrl.getOverlayStatusId() == -1  }">
                                <i class="fal fa-tv-retro"></i>
                            </div>
                            <div style="text-align: center; font-size: 11px;" class="muted">{{ $ctrl.overlayConnectionMessage()}}</div>
                        </div>
                    </div>
                </div>
                </div>
                <div ng-if="$ctrl.is.oneIntegrationIsLinked()">
                    <div style="text-align: center;font-size: 18px;color: gray;font-weight: 100;padding-bottom: 15px; padding-top: 30px;">
                        <i class="fas fa-globe"></i> INTEGRATIONS
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-around; width: 100%;">
                        <div class="connection-tile" style="margin-right: 10px;" ng-repeat="integration in $ctrl.is.getLinkedIntegrations()">
                            <span class="connection-title">{{integration.name}} <tooltip text="integration.description"></tooltip></span>
                            <connection-button
                                connected="$ctrl.is.integrationIsConnected(integration.id)"
                                connecting="$ctrl.is.integrationIsWaitingForConnectionUpdate(integration.id)"
                                connection-name="{{integration.name}}"
                                on-connection-click="$ctrl.is.toggleConnectionForIntegration(integration.id)"></connection-button>
                            <div class="sub-title">
                                <div style="padding-bottom: 4px;">Sidebar controlled <tooltip text="'Check this to have ' + integration.name + ' be controlled by the sidebar connect button.'"></tooltip></div>
                                <label class="control-fb control--checkbox" style="position: relative;height: 20px;padding: 0;margin: 0;width: 20px;">
                                    <input type="checkbox" ng-checked="$ctrl.serviceIsChecked('integration.' + integration.id)" ng-click="$ctrl.toggledServiceIsChecked('integration.' + integration.id)">
                                    <div class="control__indicator"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function(
            connectionService,
            settingsService,
            integrationService,
            connectionManager
        ) {
            const $ctrl = this;

            $ctrl.$onInit = function() {
                $ctrl.conn = connectionService;
                $ctrl.is = integrationService;
                $ctrl.cm = connectionManager;
            };


            $ctrl.toggledServiceIsChecked = function(service) {
                let sidebarControlledServices = settingsService.getSetting("SidebarControlledServices");
                if (sidebarControlledServices.includes(service)) {
                    sidebarControlledServices = sidebarControlledServices.filter(
                        s => s !== service
                    );
                } else {
                    sidebarControlledServices.push(service);
                }
                settingsService.saveSetting("SidebarControlledServices", sidebarControlledServices);
            };

            $ctrl.serviceIsChecked = function(service) {
                const sidebarControlledServices = settingsService.getSetting("SidebarControlledServices");
                return sidebarControlledServices.includes(service);
            };

            let overlayStatusId = 0;
            $ctrl.overlayConnectionMessage = function() {
                const connectionStatus = connectionManager.getConnectionStatusForService(
                    "overlay"
                );

                if (connectionStatus === "connected") {
                    overlayStatusId = 1;
                    return "Connected";
                } else if (connectionStatus === "warning") {
                    overlayStatusId = 0;
                    return "Ready, but nothing is connected at this time.";
                }
                overlayStatusId = -1;
                return "Error starting web server. App restart required.";
            };

            $ctrl.getOverlayStatusId = function() {
                return overlayStatusId;
            };

            $ctrl.ok = function() {
                $ctrl.close();
            };
        }
    });
}());
