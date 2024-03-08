"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotRadioContainer", {
            bindings: {
                inline: "<?",
                style: "@?"
            },
            transclude: true,
            template: `
                <div ng-class="$ctrl.inline ? 'controls-fb-inline' : 'controls-fb'" style="{{$ctrl.style}}" ng-transclude></div>
            `
        });

    angular
        .module('firebotApp')
        .component("firebotRadio", {
            bindings: {
                label: "@",
                description: "@?",
                tooltip: "@?",
                value: "<?",
                model: "=",
                style: "@?"
            },
            template: `
                <label class="control-fb control--radio" style="{{$ctrl.style}}">{{$ctrl.label}}<tooltip ng-if="$ctrl.tooltip" text="$ctrl.tooltip" /><span ng-if="$ctrl.description" class="muted"><br />{{$ctrl.description}}</span>
                    <input type="radio" ng-model="$ctrl.model" ng-value="$ctrl.value" />
                    <div class="control__indicator"></div>
                </label>
            `
        });
}());
