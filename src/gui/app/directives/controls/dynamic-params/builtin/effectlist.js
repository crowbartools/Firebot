"use strict";
(function() {
    angular.module("firebotApp").component("fbParamEffectList", {
        bindings: {
            schema: '<',
            value: '<',
            onInput: '&',
            onTouched: '&',
            context: '<'
        },
        template: `
          <div>
            <effect-list
                effects="$ctrl.local"
                trigger="{{$ctrl.context.trigger ? $ctrl.context.trigger : 'unknown'}}"
                trigger-meta="$ctrl.context.triggerMeta"
                update="$ctrl.effectListUpdated(effects)"
                modalId="{{$ctrl.context.modalId}}"
                is-array="true"
            ></effect-list>
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

            $ctrl.effectListUpdated = function(effects) {
                $ctrl.local = effects;
            };
        }
    });
}());