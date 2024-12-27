"use strict";

(function () {

    angular
        .module("firebotApp")
        .component("triggerSettings", {
            template: `
                <div>
                    <firebot-setting-category
                        name="Commands"
                    />
                    <firebot-setting
                        name="Default Mode For New Commands"
                        description="The default command mode to use when creating new commands (Simple vs Advanced)"
                    >
                        <firebot-select
                            options="{ true: 'Advanced', false: 'Simple' }"
                            ng-init="selectedCmdMode = settings.getSetting('DefaultToAdvancedCommandMode')"
                            selected="selectedCmdMode"
                            on-update="settings.saveSetting('DefaultToAdvancedCommandMode', option === 'true')"
                            right-justify="true"
                            aria-label="Choose your Default Mode For New Commands"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Allow Shared Chat To Trigger Commands"
                        description="Allow commands to be triggered by chat messages sent in other channels during Twitch Shared Chat"
                    >
                        <firebot-select
                            options="{ true: 'Yes', false: 'No' }"
                            ng-init="allowSharedChatCommands = settings.getSetting('AllowCommandsInSharedChat')"
                            selected="allowSharedChatCommands"
                            on-update="settings.saveSetting('AllowCommandsInSharedChat', option === 'true')"
                            right-justify="true"
                            aria-label="Allow Shared Chat To Trigger Commands"
                        />
                    </firebot-setting>

                    <firebot-setting-category
                        name="Events"
                        pad-top="true"
                    />
                    <firebot-setting
                        name="Ignore Related Gift Sub Events"
                        description="When this is enabled, Firebot will attempt to ignore subsequent Gift Sub events after a Community Gift Sub event. This means only the Community Sub event would fire instead of the Community Sub event AND an additional Gift Sub event for every recipient."
                    >
                        <firebot-select
                            options="{ true: 'Yes', false: 'No' }"
                            ng-init="ignoreSubEvents = settings.getSetting('IgnoreSubsequentSubEventsAfterCommunitySub')"
                            selected="ignoreSubEvents"
                            on-update="settings.saveSetting('IgnoreSubsequentSubEventsAfterCommunitySub', option === 'true')"
                            right-justify="true"
                            aria-label="enable or disable Ignore Related Gift Sub Events"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Upcoming Scheduled Ad Break Trigger"
                        description="Use this to set the number of minutes before the next scheduled ad break to trigger the Scheduled Ad Break Starting Soon event, or disable it completely. This may trigger sooner than the configured value at the beginning of a stream, depending on your Twitch Ads Manager settings. NOTE: You must be a Twitch affiliate/partner and have the Twitch Ads Manager enabled in order for this event to trigger."
                    >
                        <firebot-select
                            options="{ 0: 'Disabled', 1: '1 minute', 3: '3 minutes', 5: '5 minutes', 10: '10 minutes', 15: '15 minutes', 20: '20 minutes' }"
                            ng-init="triggerUpcomingAdBreakMinutes = settings.getSetting('TriggerUpcomingAdBreakMinutes')"
                            selected="triggerUpcomingAdBreakMinutes"
                            on-update="settings.saveSetting('TriggerUpcomingAdBreakMinutes', option)"
                            right-justify="true"
                            aria-label="Choose your Upcoming Scheduled Ad Break Trigger"
                        />
                    </firebot-setting>
                </div>
          `,
            controller: function ($scope, settingsService) {
                $scope.settings = settingsService;
            }
        });
}());
