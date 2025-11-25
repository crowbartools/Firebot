"use strict";
(function() {
    angular.module("firebotApp").component("dynamicParameters", {
        bindings: {
            settingsSchema: "<",
            settings: "=",
            trigger: "@?",
            triggerMeta: "<?",
            modalId: "@?"
        },
        template: `
            <dynamic-parameter
                ng-repeat="settingSchema in $ctrl.settingsSchema"
                name="{{settingSchema.name}}"
                schema="settingSchema"
                ng-model="$ctrl.settings[settingSchema.name]"
                trigger="{{$ctrl.trigger}}"
                trigger-meta="$ctrl.triggerMeta"
                modal-id="{{$ctrl.modalId}}"
                ng-if="$ctrl.shouldShowParameter(settingSchema)"
            >
            </dynamic-parameter>
        `,
        controller: function() {
            const $ctrl = this;

            $ctrl.shouldShowParameter = function(paramSchema) {
                const showIf = paramSchema?.showIf;
                if (!showIf) {
                    return true;
                }
                for (const [key, val] of Object.entries(showIf)) {
                    if (!$ctrl.settings || $ctrl.settings[key] !== val) {
                        return false;
                    }
                }
                return true;
            };

            $ctrl.$onInit = function() {
                // Initialize settings object if not provided
                if (!$ctrl.settings) {
                    $ctrl.settings = {};
                }
            };
        }
    });
})();
