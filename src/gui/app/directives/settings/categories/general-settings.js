"use strict";

(function() {

    angular
        .module("firebotApp")
        .component("generalSettings", {
            template: `
                <div>
                    <firebot-setting
                        name="Theme"
                        description="Choose your color theme for Firebot!"
                    >
                        <firebot-select
                            options="['Light', 'Midnight', 'Obsidian']"
                            ng-init="selectedTheme = settings.getTheme()"
                            selected="selectedTheme"
                            on-update="settings.setTheme(option)"
                            right-justify="true"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Minimize to Tray"
                        description="When minimized, Firebot will minimize to tray instead of task bar"
                    >
                        <toggle-button
                            toggle-model="settings.getMinimizeToTray()"
                            on-toggle="settings.setMinimizeToTray(!settings.getMinimizeToTray())"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Beta Notifications"
                        description="Firebot automatically updates to new stable versions. It does not automatically update to betas or major new
                        releases however. Enable if you want to be notified of new beta releases."
                    >
                        <toggle-button
                            toggle-model="settings.notifyOnBeta()"
                            on-toggle="settings.setNotifyOnBeta(!settings.notifyOnBeta())"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Connection Sounds"
                        description="Get audible alerts when Firebot connects or disconnects."
                    >
                        <toggle-button
                            toggle-model="settings.soundsEnabled() === 'On'"
                            on-toggle="settings.setSoundsEnabled(settings.soundsEnabled() === 'On' ? 'Off' : 'On')"
                            font-size="40"
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
                            >
                                <span class="dropdown-text">{{settings.getAudioOutputDevice().label}}</span>
                                <span class="caret"></span>
                            </button>
                            <ul class="dropdown-menu right-justified-dropdown">
                                <li ng-repeat="device in audioOutputDevices">
                                    <a
                                        href
                                        ng-click="settings.setAudioOutputDevice(device)"
                                    >{{device.label}}</a>
                                </li>
                                <li class="divider"></li>
                                <li
                                    role="menuitem"
                                    ng-click="settings.setAudioOutputDevice({label: 'Send To Overlay', deviceId: 'overlay'})"
                                >
                                    <a href>Send To Overlay</a>
                                </li>
                            </ul>
                        </div>
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
                                    ng-click="settings.setShowUptimeStat(!settings.getShowUptimeStat())"
                                    ng-checked="settings.getShowUptimeStat()"
                                    aria-label="..."
                                />
                                <div class="control__indicator"></div>
                            </label>
                            <label class="control-fb control--checkbox"
                                >Viewer count
                                <input
                                    type="checkbox"
                                    ng-click="settings.setShowViewerCountStat(!settings.getShowViewerCountStat())"
                                    ng-checked="settings.getShowViewerCountStat()"
                                    aria-label="..."
                                />
                                <div class="control__indicator"></div>
                            </label>
                            <label class="control-fb control--checkbox"
                                >Hype Trains
                                <input
                                    type="checkbox"
                                    ng-click="settings.setShowHypeTrainIndicator(!settings.getShowHypeTrainIndicator())"
                                    ng-checked="settings.getShowHypeTrainIndicator()"
                                    aria-label="..."
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
                            ng-init="selectedTimeout = settings.getActiveChatUserListTimeout()"
                            selected="selectedTimeout"
                            on-update="setActiveChatUserTimeout(option)"
                            right-justify="true"
                        />
                        <span> minutes</span>
                    </firebot-setting>

                    <firebot-setting
                        name="Open Stream Preview on Launch"
                        description="Automatically open the Stream Preview window when Firebot launches."
                    >
                        <toggle-button
                            toggle-model="settings.getOpenStreamPreviewOnLaunch()"
                            on-toggle="settings.setOpenStreamPreviewOnLaunch(!settings.getOpenStreamPreviewOnLaunch())"
                            font-size="40"
                            accessibility-label="(settings.getOpenStreamPreviewOnLaunch() ? 'Disable' : 'Enable') + ' Stream Preview on Launch'"
                        />
                    </firebot-setting>
                </div>
          `,
            controller: function($scope, settingsService, $q) {
                $scope.settings = settingsService;

                $scope.audioOutputDevices = [{
                    label: "System Default",
                    deviceId: "default"
                }];

                $q
                    .when(navigator.mediaDevices.enumerateDevices())
                    .then(deviceList => {
                        deviceList = deviceList
                            .filter(
                                d =>
                                    d.kind === "audiooutput" &&
                                d.deviceId !== "communications" &&
                                d.deviceId !== "default"
                            )
                            .map(d => {
                                return { label: d.label, deviceId: d.deviceId };
                            });

                        $scope.audioOutputDevices = $scope.audioOutputDevices.concat(
                            deviceList
                        );
                    });

                $scope.setActiveChatUserTimeout = (value) => {
                    if (value == null) {
                        value = "10";
                    }
                    settingsService.setActiveChatUserListTimeout(value);
                    ipcRenderer.send('setActiveChatUserTimeout', value);
                };
            }
        });
}());
