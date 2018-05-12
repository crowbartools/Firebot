'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("sidebar", {
            bindings: {
            },
            template: `
            <div class="fb-nav" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">
                <div class="nav-header">
                    <img class="nav-header-icon" ng-class="{'contracted': !$ctrl.sbm.navExpanded}" src="../images/logo_transparent.png">      
                    <span class="nav-header-title" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">Firebot</span>
                    <span class="nav-expand-button" ng-class="{'contracted': !$ctrl.sbm.navExpanded}" ng-click="$ctrl.sbm.toggleNav()">
                        <i class="fal" ng-class="$ctrl.sbm.navExpanded ? 'fa-angle-left' : 'fa-angle-right'"></i>
                    </span>
                </div>
                <div class="nav-body-wrapper">
                    <div class="nav-links-wrapper" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">

                        <nav-category name="Interactive"></nav-category>
                        <nav-link name="Buttons" icon="fa-gamepad" is-index="true"></nav-link>

                        <nav-category name="Chat" pad-top="true"></nav-category>
                        <nav-link name="Commands" icon="fa-bullhorn"></nav-link>
                        <nav-link name="Chat Feed" icon="fa-commenting"></nav-link>

                        <nav-category name="General" pad-top="true"></nav-category>
                        <nav-link name="Events" icon="fa-star"></nav-link>
                        <nav-link name="Viewer Groups" icon="fa-users"></nav-link>
                        <nav-link name="Hotkeys" icon="fa-keyboard"></nav-link>
                        <nav-link name="Moderation" icon="fa-gavel"></nav-link>
                        <nav-link name="Settings" icon="fa-cog"></nav-link>
                        <nav-link name="Updates" icon="fa-download" badge-text="$ctrl.updateIsAvailable() ? 'NEW' : ''"></nav-link>

                    </div>
        
                    <div class="connection-status-wrapper">
                        <div class='interactive-status-wrapper'>
                            <div class="interative-status-icon" 
                                ng-class="{'contracted': !$ctrl.sbm.navExpanded, 'connected': $ctrl.cm.allServicesConnected(), 'partial-connected': $ctrl.cm.partialServicesConnected()}" 
                                uib-tooltip-template="'connectTooltipTemplate.html'" 
                                tooltip-placement="{{!$ctrl.sbm.navExpanded ? 'right-bottom' : 'top-left'}}"
                                tooltip-append-to-body="true"
                                ng-click="$ctrl.cm.toggleSidebarServices()">
                                <i class="fal" ng-class="$ctrl.cm.isWaitingForServicesStatusChange() ? 'fa-sync fa-spin force-white-text' : 'fa-power-off'"></i>
                            </div>
                            <div>
                                <div class="interactive-status-text">
                                    <div class="interative-status-title" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">
                                        <span>Connections</span>
                                    </div>
                                    <div class="interative-status-subtitle" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">
                                        <span style="width: 100%;display: flex;justify-content: space-between;margin-top: 5px;">
                                            <connection-icon type="interactive"></connection-icon>
                                            <connection-icon type="chat"></connection-icon>
                                            <connection-icon type="constellation"></connection-icon>
                                            <connection-icon type="overlay"></connection-icon>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        
                            <div class="connection-panel-btn" ng-class="{'contracted': !$ctrl.sbm.navExpanded}" uib-tooltip="Open Connection Panel" tooltip-append-to-body="true"
                                ng-click="$ctrl.showConnectionPanelModal()">
                                <span><i class="fal fa-external-link-alt"></i></span>
                            </div>
                        </div>
            
                        <div class="about-link" 
                            ng-class="{'contracted': !$ctrl.sbm.navExpanded}"
                            ng-click="$ctrl.showAboutFirebotModal()">About
                        </div>
                    </div>
                </div>

                <!-- Tooltip template -->
                <script type="text/ng-template" id="connectTooltipTemplate.html">
                  <div ng-if="!$ctrl.sbm.navExpanded">
                    <span>
                        <span><b>Interactive Status:</b></span>
                        </br> 
                        <span>{{$ctrl.cs.connectedToInteractive ? 'Connected' : 'Disconnected'}}</span>
                        <span ng-if="$ctrl.cs.connectedToInteractive"></br>{{'(' +  $ctrl.cs.connectedBoard + ')'}}</span>     
                        </br></br>
                      </span>
                      <span>
                        <span><b>Chat Status:</b></span>
                        </br> 
                        <span>{{$ctrl.cs.connectedToChat ? 'Connected' : 'Disconnected'}}</span>     
                        </br></br>
                      </span>
                      <span>
                        <span><b>Constellation Status:</b></span>
                        </br> 
                        <span>{{$ctrl.cs.connectedToConstellation ? 'Connected' : 'Disconnected'}}</span>     
                        </br></br>
                      </span>
                      <span>
                          <span><b>Overlay Status:</b></span>
                          </br> 
                          <span>{{$ctrl.wss.hasClientsConnected ? 'Connected' : 'Running, but nothing is connected'}}</span>     
                          </br></br>
                        </span>
                  </div>
                  <span>Click to toggle connection to Mixer services.</span>
                </script>
            </div>
            `,
            controller: function(sidebarManager, connectionManager, updatesService, connectionService,
                websocketService, utilityService) {
                let ctrl = this;

                ctrl.sbm = sidebarManager;

                ctrl.cm = connectionManager;

                ctrl.cs = connectionService;

                ctrl.wss = websocketService;

                ctrl.showConnectionPanelModal = function() {
                    utilityService.showModal({
                        component: "connectionPanelModal",
                        windowClass: "connection-panel-modal"
                    });
                };

                ctrl.showAboutFirebotModal = function() {
                    utilityService.showModal({
                        component: "aboutModal",
                        size: 'sm'
                    });
                };

                ctrl.updateIsAvailable = () => {
                    return updatesService.updateIsAvailable();
                };

                ctrl.$onInit = function() {

                };
            }
        });
}());