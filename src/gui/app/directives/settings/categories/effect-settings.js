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
                        <toggle-button
                            toggle-model="settings.getSetting('DefaultEffectLabelsEnabled')"
                            on-toggle="settings.saveSetting('DefaultEffectLabelsEnabled', !settings.getSetting('DefaultEffectLabelsEnabled'))"
                            font-size="40"
                        />
                    </firebot-setting>
                </div>
          `,
            controller: function ($scope, settingsService) {
                $scope.settings = settingsService;
            }
        });
}());
