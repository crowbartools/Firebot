"use strict";

(function() {
    angular.module("firebotApp")
        .component("chatSettingsModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Chat Settings</h4>
                </div>
                <div class="modal-body">
                    <div style="padding: 0 10px">
                        <div style="display: flex;align-items: center;justify-content: space-between;">
                            <span style="font-weight: 900;" id="chatUserListLabel">Chat User List</span>
                            <span>
                                <input class="tgl tgl-light sr-only" id="cb5" type="checkbox" aria-labelledby="chatUserListLabel"
                                    ng-checked="settings.getShowChatViewerList()"
                                    ng-click="settings.setShowChatViewerList(!settings.getShowChatViewerList())"/>
                                <label class="tgl-btn" for="cb5"></label>
                            </span>
                        </div>
                        <div style="display: flex;align-items: center;justify-content: space-between;">
                            <span style="font-weight: 900;" id="activityFeedLabel">Activity Feed</span>
                            <span>
                                <input class="tgl tgl-light sr-only" id="activityfeed" type="checkbox" aria-labelledby="activityFeedLabel"
                                    ng-checked="settings.showActivityFeed()"
                                    ng-click="settings.setShowActivityFeed(!settings.showActivityFeed())"/>
                                <label class="tgl-btn" for="activityfeed"></label>
                            </span>
                        </div>
                        <div style="padding-top: 10px;">
                            <div style="font-weight: 900;">Tag Notification Sound</div>
                            <span class="btn-group" uib-dropdown style="margin-bottom: 5px;">
                                <button type="button" class="btn btn-primary" uib-dropdown-toggle>
                                    {{selectedNotificationSound.name}} <span class="caret"></span>
                                </button>
                                <ul class="dropdown-menu" uib-dropdown-menu role="menu">
                                    <li role="none" ng-repeat="n in notificationOptions">
                                        <a href role="menuitem" ng-click="selectNotification(n)">{{n.name}}</a>
                                    </li>
                                </ul>
                            </span>
                            <span class="clickable" ng-click="playNotification()" style="color: #1f849e; font-size: 18px; padding-left: 5px;" aria-label="Play notification">
                                <i class="fas fa-play-circle"></i>
                            </span>
                            <file-chooser ng-show="selectedNotificationSound.name === 'Custom'"
                                model="selectedNotificationSound.path"
                                options="{title: 'Select Sound File', filters: [{name: 'Audio', extensions: ['mp3', 'ogg', 'wav', 'flac']}]}"
                                on-update="setCustomNotiPath(filepath)"></file-chooser>
                            <div class="volume-slider-wrapper" ng-hide="selectedNotificationSound.name === 'None'">
                                <i class="fal fa-volume-down volume-low" style="font-size:25px; padding-bottom:5px"></i>
                                <rzslider rz-slider-model="notificationVolume" rz-slider-options="sliderOptions"></rzslider>
                                <i class="fal fa-volume-up volume-high" style="font-size:25px; padding-bottom:5px"></i>
                            </div>
                        </div>
                        <div style="padding-top: 10px;">
                            <div style="font-weight: 900;">Display Style</div>
                            <div class="permission-type controls-fb-inline">
                                <label class="control-fb control--radio">Modern
                                <input type="radio" ng-model="compactMode" ng-value="false" ng-click="toggleCompactMode()"/>
                                <div class="control__indicator"></div>
                                </label>
                                <label class="control-fb control--radio">Compact
                                    <input type="radio" ng-model="compactMode" ng-value="true" ng-click="toggleCompactMode()"/>
                                    <div class="control__indicator"></div>
                                </label>
                            </div>
                        </div>
                        <div style="display: flex;align-items: center;justify-content: space-between;">
                            <span style="font-weight: 900;" id="alternateBackgroundsLabel">Alternate Backgrounds</span>
                            <span>
                                <input class="tgl tgl-light sr-only" id="cb9" type="checkbox" aria-labelledby="alternateBackgroundsLabel"
                                    ng-checked="settings.chatAlternateBackgrounds()"
                                    ng-click="settings.setChatAlternateBackgrounds(!settings.chatAlternateBackgrounds())"/>
                                <label class="tgl-btn" for="cb9"></label>
                            </span>
                        </div>
                        <div style="display: flex;align-items: center;justify-content: space-between;">
                            <span style="font-weight: 900;" id="hideDeletedMessagesLabel">Hide Deleted Messages <tooltip text="'Turning this on will cover deleted messages with a blackbox. Hovering over the message will reveal it. Great for letting your mods hide spoilers!'"></tooltip></span>
                            <span>
                                <input class="tgl tgl-light sr-only" id="cb10" type="checkbox" aria-labelledby="hideDeletedMessagesLabel"
                                    ng-checked="settings.chatHideDeletedMessages()"
                                    ng-click="settings.setChatHideDeletedMessages(!settings.chatHideDeletedMessages())"/>
                                <label class="tgl-btn" for="cb10"></label>
                            </span>
                        </div>

                        <div style="display: flex;align-items: center;justify-content: space-between;">
                            <span style="font-weight: 900;" id="showAvatarsLabel">Show Avatars</span>
                            <span>
                                <input class="tgl tgl-light sr-only" id="cb11" type="checkbox" aria-labelledby="showAvatarsLabel"
                                    ng-checked="settings.getShowAvatars()"
                                    ng-click="settings.setShowAvatars(!settings.getShowAvatars())"/>
                                <label class="tgl-btn" for="cb11"></label>
                            </span>
                        </div>

                        <div style="display: flex;align-items: center;justify-content: space-between;">
                            <span style="font-weight: 900;" id="showTimestampsLabel">Show Timestamps</span>
                            <span>
                                <input class="tgl tgl-light sr-only" id="cb12" type="checkbox" aria-labelledby="showTimestampsLabel"
                                    ng-checked="settings.getShowTimestamps()"
                                    ng-click="settings.setShowTimestamps(!settings.getShowTimestamps())"/>
                                <label class="tgl-btn" for="cb12"></label>
                            </span>
                        </div>

                        <div style="display: flex;align-items: center;justify-content: space-between;">
                            <span style="font-weight: 900;" id="thirdPartyEmotesLabel">Show BTTV/FFZ Emotes</span>
                            <span>
                                <input class="tgl tgl-light sr-only" id="cb13" type="checkbox" aria-labelledby="thirdPartyEmotesLabel"
                                    ng-checked="settings.getShowThirdPartyEmotes()"
                                    ng-click="settings.setShowThirdPartyEmotes(!settings.getShowThirdPartyEmotes())"/>
                                <label class="tgl-btn" for="cb13"></label>
                            </span>
                        </div>

                        <div style="display: flex;align-items: center;justify-content: space-between;">
                            <span style="font-weight: 900;" id="showPronounsLabel">Show Pronouns <a href="https://pronouns.alejo.io/" target="_blank" style="font-size:10px;"><i class="fas fa-external-link"></i></a></span>
                            <span>
                                <input class="tgl tgl-light sr-only" id="cb14" type="checkbox" aria-labelledby="showPronounsLabel"
                                    ng-checked="settings.getShowPronouns()"
                                    ng-click="settings.setShowPronouns(!settings.getShowPronouns())"/>
                                <label class="tgl-btn" for="cb14"></label>
                            </span>
                        </div>

                        <div style="display: flex;align-items: center;justify-content: space-between;">
                            <span style="font-weight: 900;" id="showCustomFontSize">Show Custom Font Size</span>
                            <span>
                                <input class="tgl tgl-light sr-only" id="cb15" type="checkbox" aria-labelledby="showCustomFontSize"
                                    ng-checked="settings.getChatCustomFontSizeEnabled()"
                                    ng-click="toggleCustomFontEnabled()"/>
                                <label class="tgl-btn" for="cb15"></label>
                            </span>
                        </div>
                        <div class="volume-slider-wrapper" ng-show="settings.getChatCustomFontSizeEnabled()">
                            <rzslider rz-slider-model="customFontSize" rz-slider-options="fontSliderOptions"></rzslider>
                        </div>

                        <div style="margin-top: 10px;">
                            <div style="font-weight: 900;" id="showCustomFontSize">Clear Chat Feed</div>
                            <dropdown-select 
                                options="clearChatFeedOptions" 
                                selected="chatFeedMode" 
                                on-update="setChatFeedMode(option)"
                            ></dropdown-select>
                        </div>

                    </div>
                </div>
                <div class="modal-footer">
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($scope, $rootScope, $timeout, settingsService, soundService) {
                const $ctrl = this;

                $scope.settings = settingsService;

                $scope.clearChatFeedOptions = {
                    never: "Never",
                    onlyStreamer: "Only when I /clear",
                    always: "When I or mods /clear"
                };
                $scope.chatFeedMode = settingsService.getClearChatFeedMode();
                $scope.setChatFeedMode = (mode) => settingsService.setClearChatFeedMode(mode);

                $scope.compactMode = settingsService.isChatCompactMode();
                $scope.toggleCompactMode = function() {
                    $scope.compactMode = !$scope.compactMode;
                    settingsService.setChatCompactMode($scope.compactMode);
                };

                $scope.playNotification = function() {
                    soundService.playChatNotification();
                };

                $scope.selectedNotificationSound = settingsService.getTaggedNotificationSound();

                $scope.notificationVolume = settingsService.getTaggedNotificationVolume();

                $scope.volumeUpdated = function() {
                    settingsService.setTaggedNotificationVolume($scope.notificationVolume);
                };

                $scope.sliderOptions = {
                    floor: 1,
                    ceil: 10,
                    hideLimitLabels: true,
                    onChange: $scope.volumeUpdated
                };

                $scope.notificationOptions = soundService.notificationSoundOptions;

                $scope.selectNotification = function(n) {
                    $scope.selectedNotificationSound = n;
                    $scope.saveSelectedNotification();
                };

                $scope.setCustomNotiPath = function(filepath) {
                    $scope.selectedNotificationSound.path = filepath;
                    $scope.saveSelectedNotification();
                };

                $scope.saveSelectedNotification = function() {
                    let sound = $scope.selectedNotificationSound;

                    settingsService.setTaggedNotificationSound({
                        name: sound.name,
                        path: sound.name === "Custom" ? sound.path : undefined
                    });
                };


                $scope.toggleCustomFontEnabled = () => {
                    settingsService.setChatCustomFontSizeEnabled(!settingsService.getChatCustomFontSizeEnabled());
                    $timeout(() => {
                        $rootScope.$broadcast("rzSliderForceRender");
                    }, 50);
                };

                $scope.customFontSize = settingsService.getChatCustomFontSize();
                $scope.fontSizeUpdated = function() {
                    settingsService.setChatCustomFontSize($scope.customFontSize);
                };
                $scope.fontSliderOptions = {
                    floor: 10,
                    ceil: 30,
                    translate: value => `${value}px`,
                    onChange: $scope.fontSizeUpdated
                };

                $ctrl.$onInit = () => {
                    $timeout(() => {
                        $rootScope.$broadcast("rzSliderForceRender");
                    }, 100);
                };
            }
        });
}());
