"use strict";

(function() {
    angular.module("firebotApp")
        .component("toggleButton", {
            bindings: {
                toggleModel: "<",
                onToggle: "&"
            },
            template: `
            <div class="toggle-button"
                ng-class="{'toggled-on': $ctrl.toggleModel}"
                ng-click="$ctrl.onToggle()">
                    <i class="fad" ng-class="{'fa-toggle-on': $ctrl.toggleModel, 'fa-toggle-off': !$ctrl.toggleModel}"></i>
            </div>
            `
        });
}());
