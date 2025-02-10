"use strict";

(function () {

    angular
        .module("firebotApp")
        .component("effectSettings", {
            template: `
                <div>
                    <firebot-setting
                        name="Default Effect Labels"
                        description="When enabled, Firebot will automatically generate labels for (most) effects that don't have a custom label set."
                    >
                        <firebot-select
                            options="{ true: 'On', false: 'Off' }"
                            ng-init="effectLabelsEnabled = settings.getSetting('DefaultEffectLabelsEnabled')"
                            selected="effectLabelsEnabled"
                            on-update="settings.saveSetting('DefaultEffectLabelsEnabled', option === 'true')"
                            right-justify="true"
                        />
                    </firebot-setting>
                </div>
          `,
            controller: function ($scope, settingsService) {
                $scope.settings = settingsService;
            }
        });
}());
