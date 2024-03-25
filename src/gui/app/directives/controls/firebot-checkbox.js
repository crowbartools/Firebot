"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotCheckbox", {
            bindings: {
                label: "@",
                tooltip: "@?",
                tooltipPlacement: "@?",
                model: "=",
                style: "@?",
                disabled: "<?"
            },
            template: `
            <label class="control-fb control--checkbox" style="{{$ctrl.style}}"> {{$ctrl.label}} <tooltip ng-if="$ctrl.tooltip" text="$ctrl.tooltip" placement="{{$ctrl.tooltipPlacement || ''}}"></tooltip>
                <input type="checkbox" ng-model="$ctrl.model" ng-disabled="$ctrl.disabled">
                <div class="control__indicator"></div>
            </label>
            `
        });
}());
