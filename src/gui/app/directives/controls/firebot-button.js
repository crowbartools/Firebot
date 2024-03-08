"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotButton", {
            bindings: {
                text: "@",
                ngClick: "&?",
                type: "@?",
                size: "@?",
                icon: "@?",
                tooltip: "@?",
                tooltipPlacement: "@?",
                loading: "<?",
                disabled: "<?"
            },
            template: `
                <button
                    class="btn"
                    ng-class="'btn-' + $ctrl.type + ' ' + $ctrl.sizeClass"
                    ng-disabled="$ctrl.disabled"
                    tooltip-enable="$ctrl.tooltip"
                    uib-tooltip="{{$ctrl.tooltip}}"
                    tooltip-placement="{{$ctrl.tooltipPlacement || 'top'}}"
                    tooltip-append-to-body="true"
                >
                <i ng-if="$ctrl.loading" class="far fa-spinner-third fa-spin" style="margin-right: 5px;"></i>
                <i ng-if="$ctrl.icon && !$ctrl.loading" ng-class="$ctrl.iconClass" style="margin-right: 5px;"></i>
                <span>{{$ctrl.text}}</span>
                </button>
            `,
            controller: function() {
                const $ctrl = this;

                $ctrl.iconClass = "";

                const buttonSizes = {
                    extraSmall: "btn-xs",
                    small: "btn-sm",
                    large: "btn-lg"
                };

                $ctrl.sizeClass = "";

                $ctrl.$onInit = () => {
                    if ($ctrl.type == null) {
                        $ctrl.type = "default";
                    }
                    if ($ctrl.size != null) {
                        $ctrl.sizeClass = buttonSizes[$ctrl.size] ?? "";
                    }
                    if ($ctrl.icon != null) {
                        const classes = $ctrl.icon.split(" ");
                        if (classes.length === 1) {
                            $ctrl.iconClass = `far ${classes[0]}`;
                        } else {
                            $ctrl.iconClass = classes.join(" ");
                        }
                    }
                };
            }
        });
}());
