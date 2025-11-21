"use strict";
(function() {
    angular.module("firebotApp").component("fbParamEnum", {
        bindings: {
            schema: '<',
            value: '<',
            onInput: '&',
            onTouched: '&'
        },
        template: `
          <div>
            <firebot-select
                ng-if="!ctrl.schema.settings || !ctrl.schema.settings.searchable"
                options="$ctrl.schema.options"
                selected="$ctrl.local"
                ng-click="$ctrl.onTouched()"
            ></firebot-select>
            <firebot-searchable-select
                ng-if="ctrl.schema.settings && ctrl.schema.settings.searchable"
                items="$ctrl.schema.options"
                ng-model="$ctrl.local"
                placeholder="{{$ctrl.schema.placeholder ? $ctrl.schema.placeholder : 'Select value'}}"
                ng-click="$ctrl.onTouched()"
            >
            </firebot-searchable-select>
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