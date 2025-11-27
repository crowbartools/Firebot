"use strict";
(function() {
    angular.module("firebotApp").component("fbParamDateTime", {
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
                type="datetime-local"
                ng-model="$ctrl.local"
                ng-change="$ctrl.onInput({ value: $ctrl.local })"
                ng-blur="$ctrl.onTouched()"
                onclick="this.showPicker()"
            />
          </div>
        `,
        controller: function() {
            const $ctrl = this;
            $ctrl.$onInit = function() {
                $ctrl.local = new Date($ctrl.value);
            };
            $ctrl.$onChanges = function(chg) {
                if (chg.value != null && chg.value.currentValue !== $ctrl.local) {
                    $ctrl.local = new Date(chg.value.currentValue);
                }
            };
        }
    });
}());