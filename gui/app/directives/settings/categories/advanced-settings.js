"use strict";

(function() {

    angular
        .module("firebotApp")
        .component("advancedSettings", {
            template: `
                <div>

                    <firebot-setting 
                        name="Debug Mode"
                        description="When Debug Mode is enabled, Firebot will log a lot more information to it's log files. This is often useful when troubleshooting an obscure problem."
                    >
                        <setting-description-addon>
                            <b
                                >Firebot must be restarted for changes to this setting to take effect.</b
                            >
                        </setting-description-addon>
                        <firebot-button 
                            text="{{settings.debugModeEnabled() ? 'Disable Debug Mode' : 'Enable Debug Mode' }}"
                            ng-click="settings.setDebugModeEnabled(!settings.debugModeEnabled())"
                        />
                    </firebot-setting>

                    <firebot-setting 
                        name="While Loop"
                        description="Enable or disable the conditional 'While Loop' option in the Loop Effects effect."
                    >
                        <setting-description-addon>
                            <b
                                >If you aren't careful, you can cause an infinite loop and freeze Firebot.</b
                            >
                        </setting-description-addon>
                        <firebot-button 
                            text="{{settings.getWhileLoopEnabled() ? 'Disable While Loops' : 'Enable While Loops' }}"
                            ng-click="toggleWhileLoops()"
                        />
                    </firebot-setting>

                    <firebot-setting 
                        name="Quote ID Recalculation"
                        description="Quote IDs in Firebot are static, even if a quote before another is deleted. If you would like to recalculate your quote IDs so that there isn't any skipped quote numbers, you can use this option."
                    >
                        <setting-description-addon>
                            <b
                                >We recommend that you make a backup first, just in case.</b
                            >
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
                            ng-init="allowQuoteCsv = settings.getAllowQuoteCSVDownloads()"
                            selected="allowQuoteCsv" 
                            on-update="settings.setAllowQuoteCSVDownloads(option === 'true')"
                            right-justify="true"
                        />
                    </firebot-setting>

                    <firebot-setting 
                        name="Persist Custom Variables"
                        description="Whether or not custom variables should be persisted to a file when Firebot closes."
                    >
                        <firebot-select 
                            options="{ true: 'On', false: 'Off' }"
                            ng-init="persistVariables = settings.getPersistCustomVariables()"
                            selected="persistVariables" 
                            on-update="settings.setPersistCustomVariables(option === 'true')"
                            right-justify="true"
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
                    const whileLoopsEnabled = settingsService.getWhileLoopEnabled();

                    if (whileLoopsEnabled) {
                        settingsService.setWhileLoopEnabled(false);
                    } else {
                        utilityService
                            .showConfirmationModal({
                                title: "Enable While Loops",
                                question: "By enabling this feature, you understand that using While Loops incorrectly can potentially cause performance issues or even freeze Firebot.",
                                confirmLabel: "I understand, enable.",
                                confirmBtnType: "btn-primary"
                            })
                            .then(confirmed => {
                                if (confirmed) {
                                    settingsService.setWhileLoopEnabled(true);
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
                        .then(confirmed => {
                            if (confirmed) {
                                backendCommunicator.fireEvent("recalc-quote-ids");
                            }
                        });
                };

            }
        });
}());
