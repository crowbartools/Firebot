"use strict";

(function() {
    angular.module("firebotApp")
        .component("firebotCheckbox", {
            bindings: {
                toggleModel: "=",
                autoUpdateValue: "<",
                onToggle: "&",
                fontSize: "<?",
                tooltip: "@?"
            },
            template: `
                <div class="firebot-checkbox"
                    ng-class="{'toggled-on': $ctrl.toggleModel}"
                    ng-click="$ctrl.toggle()"
                    ng-style="$ctrl.getCustomStyles()">
                        <i 
                            class="fad" 
                            style="display: block;" 
                            ng-class="{'fa-check-circle': $ctrl.toggleModel, 'fa-circle fa-swap-opacity': !$ctrl.toggleModel}"
                            uib-tooltip="{{$ctrl.tooltip}}" 
                            tooltip-enable="!!$ctrl.tooltip" 
                            tooltip-append-to-body="true"
                        ></i>
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
