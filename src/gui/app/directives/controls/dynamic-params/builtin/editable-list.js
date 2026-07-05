"use strict";
(function() {
    angular.module("firebotApp").component("fbParamEditableList", {
        bindings: {
            schema: '<',
            value: '<',
            onInput: '&',
            onTouched: '&',
            context: '<'
        },
        template: `
          <div>
            <editable-list
                model="$ctrl.local"
                settings="$ctrl.schema.settings"
                trigger="{{$ctrl.context.trigger ? $ctrl.context.trigger : ''}}"
                trigger-meta="$ctrl.context.triggerMeta"
            ></editable-list>
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