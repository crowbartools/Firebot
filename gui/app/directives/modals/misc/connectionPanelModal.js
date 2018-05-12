'use strict';
//
(function() {
    angular
        .module('firebotApp')
        .component("connectionPanelModal", {
            template: `
            <div class="modal-header" style="text-align: center">
                <h4 class="modal-title">Connection Panel</h4>
            </div>
            <div class="modal-body" style="padding-bottom: 30px;">
                <div>
                    <div style="text-align: center;font-size: 18px;color: gray;font-weight: 100;padding-bottom: 15px;">
                        MIXER SERVICES
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-around; width: 100%;">
                        <div class="connection-tile">
                            <span class="connection-title">Interactive <tooltip text="'Used for interactive buttons and controls'"></tooltip></span>
                            <div class="connection-button"
                                ng-class="{'connected': $ctrl.conn.connectedToInteractive, 'connecting': $ctrl.conn.waitingForStatusChange}"
                                ng-click="$ctrl.conn.toggleConnectionToInteractive()">
                                <i class="fal"
                                ng-class="$ctrl.conn.waitingForStatusChange ? 'fa-sync fa-spin' : 'fa-power-off'"></i>
                            </div>
                            <div style="display: flex;flex-direction: column;align-items: center;">
                                <div style="font-size:13px;padding-bottom: 4px;">Sidebar controlled <tooltip text="'Check this to have Interactive be controlled by the sidebar connect button.'"></tooltip></div>
                                <label class="control-fb control--checkbox" style="position: relative;height: 20px;padding: 0;margin: 0;width: 20px;"> 
                                    <input type="checkbox" ng-checked="$ctrl.serviceIsChecked('interactive')" ng-click="$ctrl.toggledServiceIsChecked('interactive')">
                                    <div class="control__indicator"></div>                                             
                                </label>
                            </div>
                        </div>
                        <div class="connection-tile">
                            <span class="connection-title">Chat <tooltip text="'Used for commands, chat effects, chat feed, auto grouping, etc'"></tooltip></span>
                            <div class="connection-button"
                                ng-class="{'connected': $ctrl.conn.connectedToChat, 'connecting': $ctrl.conn.waitingForChatStatusChange}"
                                ng-click="$ctrl.conn.toggleConnectionToChat()">
                                <i class="fal"
                                ng-class="$ctrl.conn.waitingForChatStatusChange ? 'fa-sync fa-spin' : 'fa-power-off'"></i>
                            </div>
                            <div style="display: flex;flex-direction: column;align-items: center;">
                                <div style="font-size:13px;padding-bottom: 4px;">Sidebar controlled <tooltip text="'Check this to have Chat be controlled by the sidebar connect button.'"></tooltip></div>
                                <label class="control-fb control--checkbox" style="position: relative;height: 20px;padding: 0;margin: 0;width: 20px;"> 
                                    <input type="checkbox" ng-checked="$ctrl.serviceIsChecked('chat')" ng-click="$ctrl.toggledServiceIsChecked('chat')">
                                    <div class="control__indicator"></div>                                             
                                </label>
                            </div>
                        </div>
                        <div class="connection-tile">
                            <span class="connection-title">Constellation <tooltip text="'Used for events, live viewer count on chat feed, etc'"></tooltip></span>
                            <div class="connection-button"
                                ng-class="{'connected': $ctrl.conn.connectedToConstellation, 'connecting': $ctrl.conn.waitingForConstellationStatusChange}"
                                ng-click="$ctrl.conn.toggleConnectionToConstellation()">
                                <i class="fal"
                                ng-class="$ctrl.conn.waitingForConstellationStatusChange ? 'fa-sync fa-spin' : 'fa-power-off'"></i>
                            </div>
                            <div style="display: flex;flex-direction: column;align-items: center;">
                                <div style="font-size:13px;padding-bottom: 4px;">Sidebar controlled <tooltip text="'Check this to have Constellation be controlled by the sidebar connect button.'"></tooltip></div>
                                <label class="control-fb control--checkbox" style="position: relative;height: 20px;padding: 0;margin: 0;width: 20px;"> 
                                    <input type="checkbox" ng-checked="$ctrl.serviceIsChecked('constellation')" ng-click="$ctrl.toggledServiceIsChecked('constellation')">
                                    <div class="control__indicator"></div>                                             
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div style="text-align: center;font-size: 18px;color: gray;font-weight: 100;padding: 25px 0 15px;">
                        FIREBOT SERVICES
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-around; width: 100%;">
                        <div class="connection-tile">
                            <span class="connection-title">Overlay</span>
                            <div class="overlay-button" ng-class="{ 'connected': $ctrl.wss.hasClientsConnected }">
                                <i class="fal fa-tv-retro"></i>
                            </div>
                            <div style="text-align: center;" class="muted">{{ $ctrl.wss.hasClientsConnected ? 'Running and connected to a client.' : 'Running, but nothing connected.'}}</div>
                        </div>
                    </div>
                </div>
            </div>
            `,
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function(connectionService, websocketService, settingsService) {
                let $ctrl = this;

                $ctrl.$onInit = function () {
                    $ctrl.conn = connectionService;
                    $ctrl.wss = websocketService;
                };

                let sidebarControlledServices = settingsService.getSidebarControlledServices();
                $ctrl.toggledServiceIsChecked = function(service) {
                    if (sidebarControlledServices.includes(service)) {
                        sidebarControlledServices = sidebarControlledServices.filter(s => s !== service);
                    } else {
                        sidebarControlledServices.push(service);
                    }
                    settingsService.setSidebarControlledServices(sidebarControlledServices);
                };

                $ctrl.serviceIsChecked = function(service) {
                    return sidebarControlledServices.includes(service);
                };

                $ctrl.ok = function () {
                    $ctrl.close();
                };
            }
        });
}());
