"use strict";
(function() {
    angular.module("firebotApp").component("fbParamRadioCards", {
        bindings: {
            schema: '<',
            value: '<',
            onInput: '&',
            onTouched: '&'
        },
        template: `
          <div>
            <firebot-radio-cards
                options="$ctrl.schema.options"
                ng-model="$ctrl.local"
                grid-columns="$ctrl.schema.settings && $ctrl.schema.settings.gridColumns || 2"
                ng-click="$ctrl.onTouched()"
            ></firebot-radio-cards>
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