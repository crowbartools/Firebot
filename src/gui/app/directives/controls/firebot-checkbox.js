"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotCheckbox", {
            bindings: {
                label: "@",
                tooltip: "@?",
                model: "=",
                style: "@?",
                disabled: "<?"
            },
            template: `
            <label class="control-fb control--checkbox" style="{{$ctrl.style}}"> {{$ctrl.label}} <tooltip ng-if="$ctrl.tooltip" text="$ctrl.tooltip"></tooltip>
                <input type="checkbox" ng-model="$ctrl.model" ng-disabled="$ctrl.disabled">
                <div class="control__indicator"></div>
            </label>
            `
        });
}());
