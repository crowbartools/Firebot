"use strict";

(function () {
    angular.module("firebotApp").component("advancedSettings", {
        template: `
                <div>

                    <firebot-setting
                        name="Debug Mode"
                        description="When Debug Mode is enabled, Firebot will log a lot more information to its log files. This is often useful when troubleshooting an obscure problem."
                    >
                        <setting-description-addon>
                            <b>Firebot must be restarted for changes to this setting to take effect.</b>
                        </setting-description-addon>
                        <firebot-button
                            text="{{settings.getSetting('DebugMode') ? 'Disable Debug Mode' : 'Enable Debug Mode' }}"
                            ng-click="settings.saveSetting('DebugMode', !settings.getSetting('DebugMode'))"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="While Loop"
                        description="Enable or disable the conditional 'While Loop' option in the Loop Effects effect."
                    >
                        <setting-description-addon>
                            <b>If you aren't careful, you can cause an infinite loop and freeze Firebot.</b>
                        </setting-description-addon>
                        <firebot-button
                            text="{{settings.getSetting('WhileLoopEnabled') ? 'Disable While Loops' : 'Enable While Loops' }}"
                            ng-click="toggleWhileLoops()"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Global Values"
                        description="Global Values are static values that can be used in effects via a $variable. They can be created and managed here."
                    >
                        <firebot-button
                            text="Edit Global Values"
                            ng-click="showEditGlobalValuesModal()"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Proxied Webhooks"
                        tag="Experimental"
                        description="This feature allows you to receive webhooks without exposing your local network. A 'Webhook Received' event is triggered each time a webhook is received with the payload available via the $webhookPayload variable."
                        bottom-border="false"
                    >
                        <setting-description-addon>
                            <b>This feature is experimental and not guaranteed to be stable.</b>
                        </setting-description-addon>
                        <firebot-button
                            text="Edit Webhooks"
                            ng-click="showEditWebhooksModal()"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Webhook Debug Logs"
                        description="Enable or disable logging for incoming webhooks. Webhooks might contain sensitive information. Be careful where you send logs when this option is enabled."
                    >
                        <setting-description-addon>
                            <b>Requires Debug Mode to also be enabled.</b>
                        </setting-description-addon>
                        <firebot-button
                            text="{{settings.getSetting('WebhookDebugLogs') && settings.getSetting('DebugMode') ? 'Disable Webhook Logs' : 'Enable Webhook Logs' }}"
                            disabled="!settings.getSetting('DebugMode')"
                            ng-click="settings.saveSetting('WebhookDebugLogs', !settings.getSetting('WebhookDebugLogs'))"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Quote ID Recalculation"
                        description="Quote IDs in Firebot are static, even if a quote before another is deleted. If you would like to recalculate your quote IDs so that there isn't any skipped quote numbers, you can use this option."
                    >
                        <setting-description-addon>
                            <b>We recommend that you make a backup first, just in case.</b>
                        </setting-description-addon>
                        <firebot-button
                            text="Recalculate Quote IDs"
                            ng-click="recalculateQuoteIds()"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Allow Quote .CSV Export"
                        description="Whether or not you want the 'Export as .CSV' button available for quotes on the profile page."
                    >
                        <firebot-select
                            options="{ true: 'On', false: 'Off' }"
                            ng-init="allowQuoteCsv = settings.getSetting('AllowQuoteCSVDownloads')"
                            selected="allowQuoteCsv"
                            on-update="settings.saveSetting('AllowQuoteCSVDownloads', option === 'true')"
                            right-justify="true"
                            aria-label="Choose Whether or not you want the 'Export as .CSV' button available for quotes on the profile page."

                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Persist Custom Variables"
                        description="Whether or not custom variables should be persisted to a file when Firebot closes."
                    >
                        <firebot-select
                            options="{ true: 'On', false: 'Off' }"
                            ng-init="persistVariables = settings.getSetting('PersistCustomVariables')"
                            selected="persistVariables"
                            on-update="settings.saveSetting('PersistCustomVariables', option === 'true')"
                            right-justify="true"
                            aria-label="enable or disable persistent Custom Variables"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Experimental Clip Player"
                        description="When enabled, Firebot will use an experimental method to play Twitch clips in the overlay that bypasses content warnings. This is an experimental feature and isn't guaranteed to work. If Firebot is unable to play the clip, it will fall back to the default method."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('UseExperimentalTwitchClipUrlResolver')"
                            on-toggle="settings.saveSetting('UseExperimentalTwitchClipUrlResolver', !settings.getSetting('UseExperimentalTwitchClipUrlResolver'))"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Open Effect Queue Monitor on Launch"
                        description="Automatically open the Effect Queue Monitor window when Firebot launches."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('OpenEffectQueueMonitorOnLaunch')"
                            on-toggle="settings.saveSetting('OpenEffectQueueMonitorOnLaunch', !settings.getSetting('OpenEffectQueueMonitorOnLaunch'))"
                            font-size="40"
                            accessibility-label="(settings.getSetting('OpenEffectQueueMonitorOnLaunch') ? 'Enabled' : 'Disabled') + ' Effect Queue Monitor on Launch'"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Allow Chat-Created Commands to Run Effects"
                        description="Enables the !command system command to import shared effects and run effects through variables inside command responses. Recommended only if you trust your moderators with these advanced features."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('AllowChatCreatedCommandsToRunEffects')"
                            on-toggle="settings.saveSetting('AllowChatCreatedCommandsToRunEffects', !settings.getSetting('AllowChatCreatedCommandsToRunEffects'))"
                            font-size="40"
                            accessibility-label="(settings.getSetting('AllowChatCreatedCommandsToRunEffects') ? 'Enabled' : 'Disabled') + ' Chat-Created Commands to Run Effects'"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Default Moderation User"
                        description="Sets which user account will perform moderation actions. This includes bans/timeouts, deleting/clearing chat messages, setting chat modes/Shield Mode, and Twitch shoutouts."
                    >
                        <firebot-select
                            options="{ streamer: 'Streamer', bot: 'Bot' }"
                            ng-init="defaultModerationUser = settings.getSetting('DefaultModerationUser')"
                            selected="defaultModerationUser"
                            on-update="settings.saveSetting('DefaultModerationUser', option)"
                            right-justify="true"
                            aria-label="Sets which user account will perform moderation actions"
                        />

                        <setting-description-addon>
                            <strong>NOTE: If no bot account is logged in, actions will default to the streamer account.</strong>
                        </setting-description-addon>
                    </firebot-setting>

                    <firebot-setting
                        name="Preset Effect List Recursion Limit"
                        description="Limits how many times a preset effect list can recursively call itself to prevent Firebot from hanging. When enabled, execution stops after 100 recursive calls."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('PresetRecursionLimit')"
                            on-toggle="settings.saveSetting('PresetRecursionLimit', !settings.getSetting('PresetRecursionLimit'))"
                            font-size="40"
                            accessibility-label="(settings.getSetting('PresetRecursionLimit') ? 'Enabled' : 'Disabled') + ' Preset Effect List Recursion Limit'"
                        />
                    </firebot-setting>

                    <div style="margin-top: 20px">
                        <p class="muted">Looking for a setting that used to be located here? Try checking in the Tools app menu!</p>
                    </div>

                </div>
          `,
        controller: function ($scope, settingsService, utilityService, backendCommunicator, modalService) {
            $scope.settings = settingsService;

            $scope.toggleWhileLoops = () => {
                const whileLoopsEnabled = settingsService.getSetting("WhileLoopEnabled");

                if (whileLoopsEnabled) {
                    settingsService.saveSetting("WhileLoopEnabled", false);
                } else {
                    utilityService
                        .showConfirmationModal({
                            title: "Enable While Loops",
                            question:
                                "By enabling this feature, you understand that using While Loops incorrectly can potentially cause performance issues or even freeze Firebot.",
                            confirmLabel: "I understand, enable.",
                            confirmBtnType: "btn-primary"
                        })
                        .then((confirmed) => {
                            if (confirmed) {
                                settingsService.saveSetting("WhileLoopEnabled", true);
                            }
                        });
                }
            };

            $scope.showEditWebhooksModal = function () {
                modalService.showModal({
                    component: "editWebhooksModal"
                });
            };

            $scope.showEditGlobalValuesModal = function () {
                modalService.showModal({
                    component: "editGlobalValuesModal",
                    size: "sm"
                });
            };

            $scope.recalculateQuoteIds = () => {
                utilityService
                    .showConfirmationModal({
                        title: "Recalculate Quote IDs",
                        question: `Are you sure you want to recalculate your quote IDs?`,
                        confirmLabel: "Recalculate",
                        confirmBtnType: "btn-danger"
                    })
                    .then((confirmed) => {
                        if (confirmed) {
                            backendCommunicator.fireEvent("recalc-quote-ids");
                        }
                    });
            };
        }
    });
})();
