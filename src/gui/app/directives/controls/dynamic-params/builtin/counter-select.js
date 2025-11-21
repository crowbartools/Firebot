"use strict";
(function() {
    angular.module("firebotApp").component("fbParamCounterSelect", {
        bindings: {
            schema: '<',
            value: '<',
            onInput: '&',
            onTouched: '&'
        },
        template: `
          <div>
            <firebot-searchable-select
                ng-model="$ctrl.local"
                placeholder="Select or search for a counter..."
                items="counters"
            />
          </div>
        `,
        controller: function($scope, countersService) {
            const $ctrl = this;

            $scope.counters = countersService.counters;

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