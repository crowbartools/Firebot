"use strict";

(function() {
    angular.module("firebotApp").component("fbParamHexColor", {
        bindings: {
            schema: '<',
            value: '<',
            onInput: '&',
            onTouched: '&',
            name: '@?'
        },
        template: `
          <div>
            <color-picker-input
                model="$ctrl.local"
                on-blur="$ctrl.onTouched()"
                alpha="$ctrl.schema.allowAlpha"
                name="{{$ctrl.name}}"
            ></color-picker-input>
          </div>
        `,
        controller: function($scope) {
            const $ctrl = this;
            $ctrl.$onInit = function() {
                $ctrl.local = $ctrl.value;
            };
            $ctrl.$onChanges = function(chg) {
                if (chg.value != null && chg.value.currentValue !== $ctrl.local) {
                    $ctrl.local = chg.value.currentValue;
                }
            };
            $scope.$watch('$ctrl.local', (newValue) => {
                $ctrl.onInput({ value: newValue });
            });
        }
    });
}());