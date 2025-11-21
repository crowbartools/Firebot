"use strict";
(function() {
    angular.module("firebotApp").component("fontOptions", {
        bindings: {
            modelValue: "=ngModel",
            allowAlpha: '<'
        },
        require: {
            ngModelCtrl: '^ngModel'
        },
        template: `
          <div class="input-group-addon-normalize">
            <firebot-font-select
                label="Name"
                ng-model="$ctrl.modelValue.family"
            />
            <div class="pt-2">
                <color-picker-input
                    model="$ctrl.modelValue.color"
                    alpha="$ctrl.allowAlpha"
                    label="Color"
                />
            </div>
            <div class="input-group pt-2">
                <span class="input-group-addon">Size (px)</span>
                <input
                    class="form-control"
                    type="number"
                    placeholder="Enter a number"
                    ng-model="$ctrl.modelValue.size"
                />
            </div>
            <div class="input-group pt-2">
                <span class="input-group-addon">Weight</span>
                <select
                    class="form-control"
                    ng-model="$ctrl.modelValue.weight"
                    ng-options="weight for weight in $ctrl.weights"
                ></select>
            </div>
            <div class="pt-2">
                <firebot-checkbox
                    label="Italic"
                    model="$ctrl.modelValue.italic"
                />
            </div>
          </div>
        `,
        controller: function($scope) {
            const $ctrl = this;

            $ctrl.$onInit = function() {
                $ctrl.modelValue = $ctrl.modelValue ?? {};
            };

            $scope.$watch('$ctrl.modelValue', (newValue) => {
                if ($ctrl.ngModelCtrl.$viewValue !== newValue) {
                    $ctrl.ngModelCtrl.$setViewValue(newValue);
                }
            });

            $ctrl.weights = [
                100, 200, 300, 400, 500, 600, 700, 800, 900
            ];
        }
    });
}());