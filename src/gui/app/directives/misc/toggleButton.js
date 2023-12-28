"use strict";

(function() {
    angular.module("firebotApp")
        .component("toggleButton", {
            bindings: {
                toggleModel: "=",
                autoUpdateValue: "<",
                onToggle: "&",
                fontSize: "<?",
                accessibilityLabel: "<"
            },
            template: `
                <div class="toggle-button"
                    ng-class="{'toggled-on': $ctrl.toggleModel}"
                    ng-click="$ctrl.toggle()"
                    ng-style="$ctrl.getCustomStyles()"
                    aria-label="{{ $ctrl.accessibilityLabel }}">
                        <i class="fad" style="display: block;" ng-class="{'fa-toggle-on': $ctrl.toggleModel, 'fa-toggle-off': !$ctrl.toggleModel}"></i>
                </div>
            `,
            controller: function ($timeout) {
                const $ctrl = this;

                $ctrl.toggle = () => {
                    if ($ctrl.autoUpdateValue === true) {
                        $ctrl.toggleModel = !$ctrl.toggleModel;
                    }
                    $timeout(() => {
                        $ctrl.onToggle();
                    }, 1);
                };

                $ctrl.getCustomStyles = () => {
                    if ($ctrl.fontSize) {
                        return { "font-size": `${$ctrl.fontSize}px`};
                    }
                    return {};
                };
            }
        });
}());
