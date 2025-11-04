"use strict";

(function() {
    angular
        .module('firebotApp')
        .directive('uiIndeterminate', [
            function() {

                return {
                    compile: function(tElm, tAttrs) {
                        if (!tAttrs.type || tAttrs.type.toLowerCase() !== 'checkbox') {
                            return angular.noop;
                        }

                        return function($scope, elm, attrs) {
                            $scope.$watch(attrs.uiIndeterminate, function(newVal) {
                                elm[0].indeterminate = !!newVal;
                            });
                        };
                    }
                };
            }]);

    angular
        .module('firebotApp')
        .component("firebotCheckbox", {
            bindings: {
                label: "@",
                tooltip: "@?",
                tooltipPlacement: "@?",
                model: "=",
                style: "@?",
                disabled: "<?",
                onChange: "&?",
                ngClick: "&?",
                allowIndeterminate: "<?",
                externalLink: "@?"
            },
            template: `
            <label class="control-fb control--checkbox" style="{{$ctrl.style}}"> {{$ctrl.label}} <tooltip ng-if="$ctrl.tooltip" text="$ctrl.tooltip" placement="{{$ctrl.tooltipPlacement || ''}}"></tooltip>
                <input
                    type="checkbox"
                    ng-checked="$ctrl.model"
                    ng-disabled="$ctrl.disabled"
                    ng-click="$ctrl.clicked()"
                    ui-indeterminate="$ctrl.allowIndeterminate && $ctrl.model == null"
                >
                <div class="control__indicator"></div>
                <a ng-if="$ctrl.externalLink" href="{{$ctrl.externalLink}}" target="_blank"><i class="fas fa-external-link"></i></a>
            </label>
            `,
            controller: function() {
                const $ctrl = this;

                $ctrl.clicked = function() {
                    if ($ctrl.allowIndeterminate && $ctrl.model == null) {
                        $ctrl.model = true;
                    } else if ($ctrl.allowIndeterminate && $ctrl.model === true) {
                        $ctrl.model = false;
                    } else if ($ctrl.allowIndeterminate && $ctrl.model === false) {
                        $ctrl.model = null;
                    } else {
                        $ctrl.model = !$ctrl.model;
                    }
                    if ($ctrl.onChange != null) {
                        $ctrl.onChange({ newValue: $ctrl.model });
                    }
                    if ($ctrl.ngClick != null) {
                        $ctrl.ngClick();
                    }
                };
            }
        });
}());