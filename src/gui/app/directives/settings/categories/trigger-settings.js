"use strict";

(function() {

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
                            ng-init="selectedCmdMode = settings.getDefaultToAdvancedCommandMode()"
                            selected="selectedCmdMode"
                            on-update="settings.setDefaultToAdvancedCommandMode(option === 'true')"
                            right-justify="true"
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
                            ng-init="ignoreSubEvents = settings.ignoreSubsequentSubEventsAfterCommunitySub()"
                            selected="ignoreSubEvents"
                            on-update="settings.setIgnoreSubsequentSubEventsAfterCommunitySub(option === 'true')"
                            right-justify="true"
                        />
                    </firebot-setting>

                </div>
          `,
            controller: function($scope, settingsService) {
                $scope.settings = settingsService;
            }
        });
}());
