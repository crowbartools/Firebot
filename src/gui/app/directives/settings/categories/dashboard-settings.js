"use strict";

(function () {

    angular
        .module("firebotApp")
        .component("dashboardSettings", {
            template: `
                <div>
                    <firebot-setting-category
                        name="General"
                    />

                    <firebot-setting
                        name="Show Chat Viewer List"
                        description="Show or hide the list of viewers connected to chat."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ShowChatViewerList')"
                            on-toggle="settings.saveSetting('ShowChatViewerList', !settings.getSetting('ShowChatViewerList'))"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Show Activity Feed"
                        description="Show or hide the Activity Feed, containing the events that have triggered since Firebot started."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ShowActivityFeed')"
                            on-toggle="settings.saveSetting('ShowActivityFeed', !settings.getSetting('ShowActivityFeed'))"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting-category
                        name="Quick Actions"
                        pad-top="true"
                    />

                    <firebot-setting
                        name="Edit Quick Actions"
                        description="Edit and reorder Dashboard Quick Actions."
                    >
                        <firebot-button
                            text="Edit Quick Actions"
                            ng-click="quickActionsService.openQuickActionSettingsModal()"
                        />
                    </firebot-setting>

                    <firebot-setting-category
                        name="Activity Feed"
                        pad-top="true"
                    />

                    <firebot-setting
                        name="Activity Feed Events"
                        description="Choose which events to display in the Activity Feed."
                    >
                        <firebot-button
                            text="Edit Events"
                            ng-click="activityFeed.showEditActivityFeedEventsModal()"
                        />
                    </firebot-setting>

                    <firebot-setting-category
                        name="Sounds"
                        pad-top="true"
                    />

                    <firebot-setting
                        name="Tag Notification Sound"
                        description="The sound that is played when a viewer tags you in chat."
                    >
                        <div style="width: 80%; text-align: right;">
                            <div>
                                <span class="btn-group" uib-dropdown>
                                    <button type="button" class="btn btn-default" uib-dropdown-toggle>
                                        {{selectedNotificationSound.name}} <span class="caret"></span>
                                    </button>
                                    <ul class="dropdown-menu" uib-dropdown-menu role="menu">
                                        <li role="none" ng-repeat="n in notificationSoundOptions">
                                            <a href role="menuitem" ng-click="selectNotification(n)">{{n.name}}</a>
                                        </li>
                                    </ul>
                                </span>
                                <span class="clickable pl-2 text-3xl" ng-click="sounds.playChatNotification()" style="color: #1f849e;" aria-label="Play notification sound">
                                    <i class="fas fa-play-circle"></i>
                                </span>
                            </div>
                            <div class="mt-4" ng-show="selectedNotificationSound.name === 'Custom'">
                                <file-chooser
                                    model="selectedNotificationSound.path"
                                    options="{title: 'Select Sound File', filters: [{name: 'Audio', extensions: ['mp3', 'ogg', 'oga', 'wav', 'flac']}]}"
                                    on-update="setCustomNotiPath(filepath)"
                                />
                            </div>
                            <div class="volume-slider-wrapper mt-4" ng-hide="selectedNotificationSound.name === 'None'">
                                <i class="fal fa-volume-down volume-low pb-2 text-4xl"></i>
                                <rzslider rz-slider-model="notificationVolume" rz-slider-options="volumeSliderOptions" />
                                <i class="fal fa-volume-up volume-high pb-2 text-4xl"></i>
                            </div>
                        </div>
                    </firebot-setting>

                    <firebot-setting-category
                        name="Chat Display"
                        pad-top="true"
                    />

                    <firebot-setting
                        name="Message Style"
                        description="This is how chat messages will be displayed in the chat feed."
                    >
                        <firebot-select
                            options="{ true: 'Compact', false: 'Modern (Expanded)' }"
                            ng-init="compactMode = settings.getSetting('ChatCompactMode')"
                            selected="compactMode"
                            on-update="settings.saveSetting('ChatCompactMode', option === 'true')"
                            right-justify="true"
                            aria-label="Set chat message display style to Compact or Modern (Expanded)"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Alternate Backgrounds"
                        description="Alternate the backgrounds of each chat message to make them easier to differentiate."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ChatAlternateBackgrounds')"
                            on-toggle="settings.saveSetting('ChatAlternateBackgrounds', !settings.getSetting('ChatAlternateBackgrounds'))"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Show Shared Chat Info"
                        description="Display info about the channel a chat message was sent in during a shared chat session in the chat feed."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ChatShowSharedChatInfo')"
                            on-toggle="settings.saveSetting('ChatShowSharedChatInfo', !settings.getSetting('ChatShowSharedChatInfo'))"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Show Avatars"
                        description="Display the chatter's avatar on messages in the chat feed."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ChatAvatars')"
                            on-toggle="settings.saveSetting('ChatAvatars', !settings.getSetting('ChatAvatars'))"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Show Timestamps"
                        description="Display the timestamp of messages in the chat feed."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ChatTimestamps')"
                            on-toggle="settings.saveSetting('ChatTimestamps', !settings.getSetting('ChatTimestamps'))"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Show Pronouns"
                        description="Display the pronouns of chatters in the chat feed."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ChatPronouns')"
                            on-toggle="settings.saveSetting('ChatPronouns', !settings.getSetting('ChatPronouns'))"
                            font-size="40"
                        />

                        <setting-description-addon>
                            <strong>Pronouns are provided by the third-party <a href="https://pr.alejo.io/">Twitch Chat Pronouns</a> service.</strong>
                        </setting-description-addon>
                    </firebot-setting>

                    <firebot-setting
                        name="Reverse Chat Order"
                        description="When this is enabled, new chat messages will be shown at the top of the chat feed instead of the bottom."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ChatReverseOrder')"
                            on-toggle="settings.saveSetting('ChatReverseOrder', !settings.getSetting('ChatReverseOrder'))"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Use Custom Chat Font Family"
                        description="Use a custom font family in the chat feed."
                    >
                        <div style="text-align: right">
                            <toggle-button
                                toggle-model="settings.getSetting('ChatCustomFontFamilyEnabled')"
                                on-toggle="settings.saveSetting('ChatCustomFontFamilyEnabled', !settings.getSetting('ChatCustomFontFamilyEnabled'))"
                                font-size="40"
                            />

                            <firebot-font-select
                                ng-show="settings.getSetting('ChatCustomFontFamilyEnabled')"
                                ng-model="chatFontSettings.family"
                                on-select="settings.saveSetting('ChatCustomFontFamily', chatFontSettings.family)"
                            />
                        </div>
                    </firebot-setting>

                    <firebot-setting
                        name="Use Custom Chat Font Size"
                        description="Use a custom font size in the chat feed."
                    >
                        <div style="text-align: right">
                            <toggle-button
                                toggle-model="settings.getSetting('ChatCustomFontSizeEnabled')"
                                on-toggle="settings.saveSetting('ChatCustomFontSizeEnabled', !settings.getSetting('ChatCustomFontSizeEnabled'))"
                                font-size="40"
                            />

                            <firebot-input
                                class="mt-4"
                                ng-show="settings.getSetting('ChatCustomFontSizeEnabled')"
                                input-type="number"
                                placeholder="Enter a number"
                                model="chatFontSettings.size"
                                on-input-update="settings.saveSetting('ChatCustomFontSize', chatFontSettings.size)"
                                disable-variables="true"
                            />
                        </div>
                    </firebot-setting>

                    <firebot-setting-category
                        name="Emotes"
                        pad-top="true"
                    />

                    <firebot-setting
                        name="Load All Available Twitch Emotes"
                        description="This will add ALL Twitch emotes that the streamer and bot accounts can use to the chat autocomplete list. This includes any subscriber, follower, bits tier, etc. emotes."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ChatGetAllEmotes')"
                            on-toggle="settings.saveSetting('ChatGetAllEmotes', !settings.getSetting('ChatGetAllEmotes'))"
                            font-size="40"
                        />

                        <setting-description-addon>
                            <strong>NOTE: It can take SEVERAL seconds for emotes to load after connecting to chat. Changes to this setting will take effect next time you connect to chat.</strong>
                        </setting-description-addon>
                    </firebot-setting>

                    <firebot-setting
                        name="Third-Party Emotes"
                        description="Firebot will load third-party emotes from the services enabled here."
                    >
                        <div>
                            <firebot-checkbox
                                model="thirdPartyEmoteProviders.bttv"
                                label="BTTV"
                                external-link="https://betterttv.com/"
                                ng-click="setShowThirdPartyEmotes('bttv')"
                            />

                            <firebot-checkbox
                                model="thirdPartyEmoteProviders.ffz"
                                label="FFZ"
                                external-link="https://frankerfacez.com/"
                                ng-click="setShowThirdPartyEmotes('ffz')"
                            />

                            <firebot-checkbox
                                model="thirdPartyEmoteProviders.seventv"
                                label="7TV"
                                external-link="https://7tv.app/"
                                ng-click="setShowThirdPartyEmotes('seventv')"
                            />
                        </div>
                    </firebot-setting>

                    <firebot-setting-category
                        name="Filtering"
                        pad-top="true"
                    />

                    <firebot-setting
                        name="Chat Clear Mode"
                        description="Determines how clearing Twitch chat also clears Firebot chat."
                    >
                        <firebot-select
                            ng-init="clearChatFeedMode = settings.getSetting('ClearChatFeedMode')"
                            options="clearChatFeedOptions"
                            selected="clearChatFeedMode"
                            on-update="settings.saveSetting('ClearChatFeedMode', option)"
                            aria-label="Determines how clearing Twitch chat also clears Firebot chat."
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Hide Deleted Messages"
                        description="Turning this on will cover deleted messages with a black box. Hovering over the message will reveal it. Great for letting your mods hide spoilers!"
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ChatHideDeletedMessages')"
                            on-toggle="settings.saveSetting('ChatHideDeletedMessages', !settings.getSetting('ChatHideDeletedMessages'))"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Hide Bot Account Messages"
                        description="Hide any messages sent from your bot account in the chat feed. This requires having a bot account logged in."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ChatHideBotAccountMessages')"
                            on-toggle="settings.saveSetting('ChatHideBotAccountMessages', !settings.getSetting('ChatHideBotAccountMessages'))"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Hide Whispers"
                        description="Hide any whispers (private messages) you receive in the chat feed."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ChatHideWhispers')"
                            on-toggle="settings.saveSetting('ChatHideWhispers', !settings.getSetting('ChatHideWhispers'))"
                            font-size="40"
                        />
                    </firebot-setting>
                </div>
          `,
            controller: function (
                $scope,
                $timeout,
                $rootScope,
                settingsService,
                soundService,
                chatMessagesService,
                activityFeedService,
                quickActionsService
            ) {
                $scope.settings = settingsService;
                $scope.sounds = soundService;
                $scope.activityFeed = activityFeedService;
                $scope.quickActionsService = quickActionsService;

                $scope.selectedNotificationSound = settingsService.getSetting("ChatTaggedNotificationSound");
                $scope.notificationVolume = settingsService.getSetting("ChatTaggedNotificationVolume");
                $scope.notificationSoundOptions = soundService.notificationSoundOptions;

                $scope.volumeUpdated = () => {
                    settingsService.saveSetting("ChatTaggedNotificationVolume", $scope.notificationVolume);
                };

                $scope.volumeSliderOptions = {
                    floor: 1,
                    ceil: 10,
                    hideLimitLabels: true,
                    onChange: $scope.volumeUpdated
                };

                $scope.selectNotification = function(n) {
                    $scope.selectedNotificationSound = n;
                    $scope.saveSelectedNotification();
                };

                $scope.setCustomNotiPath = function(filepath) {
                    $scope.selectedNotificationSound.path = filepath;
                    $scope.saveSelectedNotification();
                };

                $scope.saveSelectedNotification = function() {
                    const sound = $scope.selectedNotificationSound;

                    $timeout(() => {
                        $rootScope.$broadcast("rzSliderForceRender");
                    }, 50);

                    settingsService.saveSetting("ChatTaggedNotificationSound", {
                        name: sound.name,
                        path: sound.name === "Custom" ? sound.path : undefined
                    });
                };

                $scope.chatFontSettings = {
                    family: settingsService.getSetting("ChatCustomFontFamily"),
                    size: settingsService.getSetting("ChatCustomFontSize")
                };

                $scope.thirdPartyEmoteProviders = {
                    bttv: settingsService.getSetting("ChatShowBttvEmotes"),
                    ffz: settingsService.getSetting("ChatShowFfzEmotes"),
                    seventv: settingsService.getSetting("ChatShowSevenTvEmotes")
                };

                $scope.setShowThirdPartyEmotes = (service) => {
                    switch (service) {
                        case "bttv":
                            settingsService.saveSetting("ChatShowBttvEmotes", $scope.thirdPartyEmoteProviders.bttv);
                            break;
                        case "ffz":
                            settingsService.saveSetting("ChatShowFfzEmotes", $scope.thirdPartyEmoteProviders.ffz);
                            break;
                        case "seventv":
                            settingsService.saveSetting("ChatShowSevenTvEmotes", $scope.thirdPartyEmoteProviders.seventv);
                            break;
                    }

                    chatMessagesService.refreshEmotes();
                };

                $scope.clearChatFeedOptions = {
                    never: "Never",
                    onlyStreamer: "Only when I /clear",
                    always: "When I or mods /clear"
                };

                $scope.quickActionSettings = settingsService.getSetting("QuickActions");
            }
        });
}());