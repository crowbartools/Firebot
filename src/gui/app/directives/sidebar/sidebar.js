"use strict";

(function() {
    angular.module("firebotApp").component("sidebar", {
        bindings: {},
        template: `
            <div class="fb-nav" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">
                <div class="nav-header">
                    <img class="nav-header-icon" ng-class="{'contracted': !$ctrl.sbm.navExpanded}" src="../images/logo_transparent.png">
                    <span class="nav-header-title" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">Firebot</span>
                    <span class="nav-expand-button" ng-class="{'contracted': !$ctrl.sbm.navExpanded}" ng-click="$ctrl.sbm.toggleNav()" aria-label="{{$ctrl.sbm.navExpanded ? 'Contract Sidebar' : 'Expand Sidebar'}}">
                        <i class="fal" ng-class="$ctrl.sbm.navExpanded ? 'fa-angle-left' : 'fa-angle-right'"></i>
                    </span>
                </div>
                <div class="nav-body-wrapper">
                    <nav class="nav-links-wrapper" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">
                        <ul class="pl-0">
                            <nav-link page="Chat Feed" name="{{'SIDEBAR.CHAT.CHAT_FEED' | translate }}" icon="fa-signal-stream"></nav-link>

                            <nav-category name="Triggers" pad-top="true"></nav-category>
                            <nav-link page="Commands" name="{{'SIDEBAR.CHAT.COMMANDS' | translate }}" icon="fa-exclamation"></nav-link>
                            <nav-link page="Events" name="{{'SIDEBAR.OTHER.EVENTS' | translate }}" icon="fa-list"></nav-link>
                            <nav-link page="Timers" name="{{'SIDEBAR.OTHER.TIME_BASED' | translate }}" icon="fa-stopwatch"></nav-link>
                            <nav-link page="Channel Rewards" name="{{'SIDEBAR.OTHER.CHANNELREWARDS' | translate }}" icon="fa-gifts"></nav-link>
                            <nav-link page="Preset Effect Lists" name="{{ 'SIDEBAR.OTHER.PRESET_EFFECT_LISTS' | translate }}" icon="fa-magic"></nav-link>
                            <nav-link page="Hotkeys" name="{{'SIDEBAR.OTHER.HOTKEYS' | translate }}" icon="fa-keyboard"></nav-link>
                            <nav-link page="Counters" name="{{'SIDEBAR.OTHER.COUNTERS' | translate }}" icon="fa-tally"></nav-link>

                            <div ng-if="$ctrl.extensionPages().length">
                                <nav-category name="Custom" pad-top="true"></nav-category>
                                <nav-link ng-repeat="page in $ctrl.extensionPages()" extension-id="page.extensionId" extension-page-id="page.id" custom-href="{{page.href}}" page="{{page.href}}" name="{{ page.name }}" icon="{{page.icon}}"></nav-link>
                            </div>

                            <nav-category name="{{'SIDEBAR.MANAGEMENT' | translate }}" pad-top="true"></nav-category>
                            <nav-link page="Effect Queues" name="{{ 'SIDEBAR.OTHER.EFFECT_QUEUES' | translate }}" icon="fa-stream"></nav-link>
                            <nav-link page="Variable Macros" name="Variable Macros" icon="fa-layer-group"></nav-link>
                            <nav-link page="Games" name="Games" icon="fa-dice"></nav-link>
                            <nav-link page="Moderation" name="Moderation" icon="fa-gavel"></nav-link>
                            <nav-link page="Currency" name="{{'SIDEBAR.MANAGEMENT.CURRENCY' | translate }}" icon="fa-money-bill" ng-if="$ctrl.isViewerDBOn()"></nav-link>
                            <nav-link page="Quotes" name="{{'SIDEBAR.MANAGEMENT.QUOTES' | translate }}" icon="fa-quote-right"></nav-link>
                            <nav-link page="Viewers" name="{{'SIDEBAR.MANAGEMENT.VIEWERS' | translate }}" icon="fa-users" ng-if="$ctrl.isViewerDBOn()"></nav-link>
                            <nav-link page="Roles And Ranks" name="{{'SIDEBAR.MANAGEMENT.VIEWER_ROLES' | translate }}" icon="fa-user-tag"></nav-link>
                            <nav-link page="Settings" name="{{'SIDEBAR.MANAGEMENT.SETTINGS' | translate }}" icon="fa-cog"></nav-link>
                            <nav-link page="Updates" name="{{'SIDEBAR.MANAGEMENT.UPDATES' | translate }}" icon="fa-download" badge-text="$ctrl.updateIsAvailable() ? 'NEW' : ''"></nav-link>
                        </ul>
                    </nav>

                    <div>
                        <patronage-tracker ng-show="$ctrl.cs.accounts.streamer.partnered"></patronage-tracker>

                        <div class="connection-status-wrapper">
                            <div class='interactive-status-wrapper'>
                                <div class="interative-status-icon"
                                    ng-class="{'contracted': !$ctrl.sbm.navExpanded, 'connected': $ctrl.cs.sidebarServicesOverallStatus === 'connected', 'partial-connected': $ctrl.cs.sidebarServicesOverallStatus === 'partial'}"
                                    uib-tooltip-template="'connectTooltipTemplate.html'"
                                    tooltip-placement="{{!$ctrl.sbm.navExpanded ? 'right-bottom' : 'top-left'}}"
                                    tooltip-append-to-body="true"
                                    ng-click="$ctrl.cs.toggleSidebarControlledServices()"
                                    tabindex="0"
                                    aria-label="{{ $ctrl.cs.sidebarServicesOverallStatus == 'connected' ? 'Disconnect Services' : 'Connect Services' }}">
                                    <i class="fad" ng-class="$ctrl.cs.isConnectingAll ? 'fa-sync fa-spin force-white-text' : 'fa-power-off'"></i>
                                </div>
                                <div style="cursor:pointer;" ng-click="$ctrl.showConnectionPanelModal()">
                                    <div class="interactive-status-text">
                                        <div class="interative-status-title" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">
                                            <span>Connections</span>
                                        </div>
                                        <div class="interative-status-subtitle" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">
                                            <span style="width: 100%;display: flex;justify-content: space-between;margin-top: 5px;">
                                                <connection-icon type="chat"></connection-icon>
                                                <connection-icon type="overlay"></connection-icon>
                                                <connection-icon type="integrations" ng-if="$ctrl.is.oneIntegrationIsLinked()"></connection-icon>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div class="connection-panel-btn" ng-class="{'contracted': !$ctrl.sbm.navExpanded}" uib-tooltip="Open Connection Panel" tooltip-append-to-body="true"
                                    ng-click="$ctrl.showConnectionPanelModal()">
                                    <span><i class="fal fa-external-link-alt"></i></span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Tooltip template -->
                <script type="text/ng-template" id="connectTooltipTemplate.html">
                  <div ng-if="!$ctrl.sbm.navExpanded">
                      <span>
                        <span><b>Twitch Status:</b></span>
                        </br>
                        <span>{{ $ctrl.cs.connections['chat'] === 'connected' ? 'CONNECTED' : 'DISCONNECTED' | translate }}</span>
                        </br></br>
                      </span>
                      <span>
                          <span><b>Overlay Status:</b></span>
                          </br>
                          <span>{{ $ctrl.cs.connections['overlay'] === 'connected' ? 'CONNECTED' : 'RUNNING_NOT_CONNECTED' | translate }}</span>
                          </br></br>
                        </span>
                  </div>
                  <span>{{'SIDEBAR.CONNECTIONS.TOGGLE' | translate }}</span>
                </script>
            </div>
            `,
        controller: function(
            sidebarManager,
            updatesService,
            connectionService,
            integrationService,
            utilityService,
            settingsService,
            uiExtensionsService
        ) {
            const ctrl = this;

            ctrl.sbm = sidebarManager;

            ctrl.cs = connectionService;

            ctrl.is = integrationService;

            ctrl.isViewerDBOn = () => settingsService.getSetting("ViewerDB");

            ctrl.extensionPages = () => uiExtensionsService.extensions.map(e => e.pages.map((p) => {
                p.extensionId = e.id;
                return p;
            })).flat();

            ctrl.showConnectionPanelModal = function() {
                utilityService.showModal({
                    component: "connectionPanelModal",
                    windowClass: "connection-panel-modal",
                    backdrop: true
                });
            };

            ctrl.updateIsAvailable = () => {
                return updatesService.updateIsAvailable();
            };

            ctrl.$onInit = function() {};
        }
    });
})();
