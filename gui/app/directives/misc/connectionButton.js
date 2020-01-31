"use strict";

(function() {
    angular.module("firebotApp")
        .component("connectionButton", {
            bindings: {
                connected: "<",
                connecting: "<",
                onConnectionClick: "&"
            },
            template: `
            <div class="connection-button"
                ng-class="{'connected': $ctrl.connected, 'connecting': $ctrl.connecting}"
                ng-click="$ctrl.onConnectionClick()">
                <i ng-hide="$ctrl.connecting" class="fad" ng-class="{'fa-toggle-on': $ctrl.connected, 'fa-toggle-off': !$ctrl.connected}" disable-animate></i>
                <i ng-if="$ctrl.connecting && !$ctrl.connected" class="fad fa-sync fa-spin" disable-animate></i>
            </div>
            `,
            controller: function() {
                let $ctrl = this;
            }
        });
}());
