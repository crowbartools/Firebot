"use strict";

(function () {
    angular.module("firebotApp").component("generalSettings", {
        template: `
                <div>
                    <firebot-setting
                        name="Theme"
                        description="Choose your color theme for Firebot!"
                    >
                        <firebot-select
                            aria-label="App Theme"
                            options="['Light', 'Midnight', 'Obsidian']"
                            ng-init="selectedTheme = settings.getSetting('Theme')"
                            selected="selectedTheme"
                            on-update="settings.saveSetting('Theme', option)"
                            right-justify="true"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Minimize to Tray"
                        description="When minimized, Firebot will minimize to tray instead of task bar"
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('MinimizeToTray')"
                            on-toggle="settings.saveSetting('MinimizeToTray', !settings.getSetting('MinimizeToTray'))"
                            font-size="40"
                            aria-label="Minimize to Tray, When minimized, Firebot will minimize to tray instead of task bar"
                            accessibility-label="(settings.getSetting('MinimizeToTray') ? 'Enabled' : 'Disabled') + ' When minimized, Firebot will minimize to tray instead of task bar'"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Connection Sounds"
                        description="Get audible alerts when Firebot connects or disconnects."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('SoundsEnabled') === 'On'"
                            on-toggle="settings.saveSetting('SoundsEnabled', settings.getSetting('SoundsEnabled') === 'On' ? 'Off' : 'On')"
                            font-size="40"
                            aria-label="Connection Sounds: Get audible alerts when Firebot connects or disconnects"
                            accessibility-label="(settings.getSetting('SoundsEnabled') === 'On' ? 'Enabled' : 'Disabled') + ' Get audible alerts when Firebot connects or disconnects.'"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Sound Output Device"
                        description="Change what output device app sounds (ie connect/disconnect sounds) and Play Sound Effects are sent to."
                    >
                        <div class="dropdown">
                            <button
                                class="btn btn-default dropdown-toggle"
                                type="button"
                                id="options-emulation"
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="true"
                                aria-label="Choose your audio output device {{settings.getSetting('AudioOutputDevice').label}}"
                            >
                                <span class="dropdown-text">{{settings.getSetting('AudioOutputDevice').label}}</span>
                                <span class="caret"></span>
                            </button>
                            <ul class="dropdown-menu right-justified-dropdown">
                                <li ng-repeat="device in audioOutputDevices">
                                    <a
                                        href
                                        ng-click="settings.saveSetting('AudioOutputDevice', device)"
                                    >{{device.label}}</a>
                                </li>
                                <li class="divider"></li>
                                <li
                                    role="menuitem"
                                    ng-click="settings.saveSetting('AudioOutputDevice', {label: 'Send To Overlay', deviceId: 'overlay'})"
                                >
                                    <a href>Send To Overlay</a>
                                </li>
                            </ul>
                        </div>
                    </firebot-setting>

                    <firebot-setting
                        name="Beta Notifications"
                        description="Firebot automatically updates to new stable versions. It does not automatically update to betas or major new
                        releases however. Enable if you want to be notified of new beta releases."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('NotifyOnBeta')"
                            on-toggle="settings.saveSetting('NotifyOnBeta', !settings.getSetting('NotifyOnBeta'))"
                            font-size="40"
                            aria-label="Firebot automatically updates to new stable versions. It does not automatically update to betas or major new
                        releases however. Enable if you want to be notified of new beta releases."
                            accessibility-label="(settings.getSetting('NotifyOnBeta') ? 'Enabled' : 'Disabled') + ' Firebot automatically updates to new stable versions. It does not automatically update to betas or major new
                        releases however. Enable if you want to be notified of new beta releases.'"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Feature My Stream on Firebot.app"
                        description=""
                    >

                        <setting-description-addon>
                            <div style="margin-top: 10px;">
                                Enable this setting to have your stream displayed on <a
                                    class="clickable"
                                    ng-click="openLink('https://firebot.app/watch')"
                                >Firebot's website</a> when you're live.
                            </div>
                        </setting-description-addon>

                        <toggle-button
                            toggle-model="settings.getSetting('WebOnlineCheckin')"
                            on-toggle="settings.saveSetting('WebOnlineCheckin', !settings.getSetting('WebOnlineCheckin'))"
                            font-size="40"
                            aria-label="Enable this setting to have your stream displayed on Firebot's website when you're live"
                            accessibility-label="(settings.getSetting('WebOnlineCheckin') ? 'Enabled' : 'Disabled') + ' Enable this setting to have your stream displayed on Firebot\\'s website when you\\'re live'"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Live Stream Stats"
                        description="Select which stream stats show in the top bar when live."
                    >
                        <div>
                            <label class="control-fb control--checkbox"
                                >Uptime
                                <input
                                    type="checkbox"
                                    ng-click="settings.saveSetting('ShowUptimeStat', !settings.getSetting('ShowUptimeStat'))"
                                    ng-checked="settings.getSetting('ShowUptimeStat')"
                                    aria-label="Uptime"
                                />
                                <div class="control__indicator"></div>
                            </label>
                            <label class="control-fb control--checkbox"
                                >Viewer count
                                <input
                                    type="checkbox"
                                    ng-click="settings.saveSetting('ShowViewerCountStat', !settings.getSetting('ShowViewerCountStat'))"
                                    ng-checked="settings.getSetting('ShowViewerCountStat')"
                                    aria-label="Viewer count"
                                />
                                <div class="control__indicator"></div>
                            </label>
                            <label class="control-fb control--checkbox"
                                >Hype Trains
                                <input
                                    type="checkbox"
                                    ng-click="settings.saveSetting('ShowHypeTrainIndicator', !settings.getSetting('ShowHypeTrainIndicator'))"
                                    ng-checked="settings.getSetting('ShowHypeTrainIndicator')"
                                    aria-label="Hype Trains"
                                />
                                <div class="control__indicator"></div>
                            </label>
                            <label class="control-fb control--checkbox"
                                >Ad Breaks
                                <input
                                    type="checkbox"
                                    ng-click="settings.saveSetting('ShowAdBreakIndicator', !settings.getSetting('ShowAdBreakIndicator'))"
                                    ng-checked="settings.getSetting('ShowAdBreakIndicator')"
                                    aria-label="Ad Breaks"
                                />
                                <div class="control__indicator"></div>
                            </label>
                        </div>
                    </firebot-setting>

                    <firebot-setting
                        name="Inactive Viewer Time"
                        description="The amount of time it takes for an active viewer to be marked as inactive after their last chat message."
                    >
                        <firebot-select
                            options="[5,10,15,20,25,30,35,40,45,50,55,60]"
                            ng-init="selectedTimeout = settings.getSetting('ActiveChatUserListTimeout')"
                            selected="selectedTimeout"
                            on-update="setActiveChatUserTimeout(option)"
                            right-justify="true"
                            aria-label="Choose your Inactive Viewer Time"
                        />
                        <span> minutes</span>
                    </firebot-setting>

                    <firebot-setting
                        name="Open Stream Preview on Launch"
                        description="Automatically open the Stream Preview window when Firebot launches."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('OpenStreamPreviewOnLaunch')"
                            on-toggle="settings.saveSetting('OpenStreamPreviewOnLaunch', !settings.getSetting('OpenStreamPreviewOnLaunch'))"
                            font-size="40"
                            accessibility-label="(settings.getSetting('OpenStreamPreviewOnLaunch') ? 'Enabled' : 'Disabled') + ' Stream Preview on Launch'"
                        />
                    </firebot-setting>
                </div>
          `,
        controller: function ($rootScope, $scope, soundService, settingsService, $q) {
            $scope.openLink = $rootScope.openLinkExternally;
            $scope.settings = settingsService;

            $scope.audioOutputDevices = [
                {
                    label: "System Default",
                    deviceId: "default"
                }
            ];

            $q.when(soundService.getOutputDevices()).then((deviceList) => {
                $scope.audioOutputDevices = $scope.audioOutputDevices.concat(deviceList);
            });

            $scope.setActiveChatUserTimeout = (value) => {
                if (value == null) {
                    value = "10";
                }
                settingsService.saveSetting("ActiveChatUserListTimeout", value);
            };
        }
    });
})();
