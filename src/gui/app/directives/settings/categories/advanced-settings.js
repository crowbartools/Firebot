"use strict";

(function() {

    angular
        .module("firebotApp")
        .component("advancedSettings", {
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

                    <div style="margin-top: 20px">
                        <p class="muted">Looking for a setting that used to be located here? Try checking in the Tools app menu!</p>
                    </div>

                </div>
          `,
            controller: function($scope, settingsService, utilityService, backendCommunicator) {
                $scope.settings = settingsService;

                $scope.toggleWhileLoops = () => {
                    const whileLoopsEnabled = settingsService.getSetting("WhileLoopEnabled");

                    if (whileLoopsEnabled) {
                        settingsService.saveSetting("WhileLoopEnabled", false);
                    } else {
                        utilityService
                            .showConfirmationModal({
                                title: "Enable While Loops",
                                question: "By enabling this feature, you understand that using While Loops incorrectly can potentially cause performance issues or even freeze Firebot.",
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
}());
