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
                    const actualVal = $ctrl.settings ? $ctrl.settings[key] : undefined;
                    if (Array.isArray(val)) {
                        // If the value is an array, check for inclusion
                        if (Array.isArray(actualVal)) {
                            // If actualVal is also an array, check for any common elements
                            if (!actualVal.some(v => val.includes(v))) {
                                return false;
                            }
                        } else if (!val.includes(actualVal)) {
                            return false;
                        }
                    } else if (actualVal !== val) {
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
