"use strict";
(function() {
    angular.module("firebotApp").component("fbParamPassword", {
        bindings: {
            schema: '<',
            value: '<',
            onInput: '&',
            onTouched: '&'
        },
        template: `
          <div>
            <input
                class="form-control"
                type="password"
                placeholder="{{$ctrl.schema.placeholder ? $ctrl.schema.placeholder : 'Enter password'}}"
                ng-model="$ctrl.local"
                ng-change="$ctrl.onInput({ value: $ctrl.local })"
                ng-blur="$ctrl.onTouched()"
            />
          </div>
        `,
        controller: function() {
            const $ctrl = this;
            $ctrl.$onInit = function() {
                $ctrl.local = $ctrl.value;
            };
            $ctrl.$onChanges = function(chg) {
                if (chg.value != null && chg.value.currentValue !== $ctrl.local) {
                    $ctrl.local = chg.value.currentValue;
                }
            };
        }
    });
}());