"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotRadios", {
            bindings: {
                options: "=",
                model: "=",
                inline: "<?",
                style: "@?"
            },
            template: `
            <div ng-class="$ctrl.inline ? 'controls-fb-inline' : 'controls-fb'" style="{{$ctrl.style}}">
                <label class="control-fb control--radio" ng-repeat="(value, label) in $ctrl.options">{{label}}
                    <input type="radio" ng-model="$ctrl.model" ng-value="value" />
                    <div class="control__indicator"></div>
                </label>
            </div>
            `,
            controller: function() {
                //const ctrl = this;
            }
        });
}());
