"use strict";
(function() {
    angular.module("firebotApp").component("fbParamString", {
        bindings: {
            schema: '<',
            value: '<',
            onInput: '&',
            onTouched: '&',
            enableReplaceVariables: '<?'
        },
        template: `
          <div>
            <textarea
                ng-if="$ctrl.schema.useTextArea"
                ng-model="$ctrl.local"
                class="form-control"
                placeholder="{{$ctrl.schema.placeholder ? $ctrl.schema.placeholder : 'Enter text'}}"
                rows="5"
                style="width:100%"
                ng-change="$ctrl.onInput({ value: $ctrl.local })"
                ng-blur="$ctrl.onTouched()"
                replace-variables="text"
                disable-variable-menu="!$ctrl.enableReplaceVariables"
            ></textarea>
            <input
                ng-if="!$ctrl.schema.useTextArea"
                class="form-control"
                type="text"
                placeholder="{{$ctrl.schema.placeholder ? $ctrl.schema.placeholder : 'Enter text'}}"
                ng-model="$ctrl.local"
                ng-change="$ctrl.onInput({ value: $ctrl.local })"
                ng-blur="$ctrl.onTouched()"
                replace-variables="text"
                disable-variable-menu="!$ctrl.enableReplaceVariables"
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