"use strict";
(function() {
    angular.module("firebotApp").component("fbParamFontOptions", {
        bindings: {
            schema: '<',
            value: '<',
            onInput: '&',
            onTouched: '&'
        },
        template: `
          <div class="input-group-addon-normalize">
            <firebot-font-select
                label="Name"
                ng-model="$ctrl.local.family"
                ng-click="$ctrl.onTouched()"
            />
            <div class="pt-2">
                <color-picker-input
                    model="$ctrl.local.color"
                    on-blur="$ctrl.onTouched()"
                    alpha="$ctrl.schema.allowAlpha"
                    label="Color"
                    ng-click="$ctrl.onTouched()"
                />
            </div>
            <div class="input-group pt-2">
                <span class="input-group-addon">Size (px)</span>
                <input
                    class="form-control"
                    type="number"
                    placeholder="Enter a number"
                    ng-model="$ctrl.local.size"
                    ng-blur="$ctrl.onTouched()"
                />
            </div>
            <div class="input-group pt-2">
                <span class="input-group-addon">Weight</span>
                <select
                    class="form-control"
                    ng-model="$ctrl.local.weight"
                    ng-options="weight for weight in $ctrl.weights"
                    ng-click="$ctrl.onTouched()"
                ></select>
            </div>
            <div class="pt-2">
                <firebot-checkbox
                    label="Italic"
                    model="$ctrl.local.italic"
                    ng-click="$ctrl.onTouched()"
                />
            </div>
          </div>
        `,
        controller: function($scope) {
            const $ctrl = this;
            $ctrl.$onInit = function() {
                $ctrl.local = $ctrl.value ?? {};
            };
            $ctrl.$onChanges = function(chg) {
                if (chg.value != null && chg.value.currentValue !== $ctrl.local) {
                    $ctrl.local = chg.value.currentValue;
                }
            };
            $scope.$watch('$ctrl.local', (newValue) => {
                $ctrl.onInput({ value: newValue });
            }, true);

            $ctrl.weights = [
                100, 200, 300, 400, 500, 600, 700, 800, 900
            ];
        }
    });
}());