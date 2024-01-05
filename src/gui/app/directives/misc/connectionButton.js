"use strict";

(function() {
    angular.module("firebotApp")
        .component("connectionButton", {
            bindings: {
                connected: "<",
                connecting: "<",
                connectionName: "@",
                onConnectionClick: "&"
            },
            template: `
            <div class="connection-button"
                ng-class="{'connected': $ctrl.connected, 'connecting': $ctrl.connecting}"
                ng-click="$ctrl.onConnectionClick()" aria-label="{{ $ctrl.connected ? 'Disconnect ' + $ctrl.connectionName : 'Connect ' + $ctrl.connectionName}}">
                <i ng-hide="$ctrl.connecting" class="fad" ng-class="{'fa-toggle-on': $ctrl.connected, 'fa-toggle-off': !$ctrl.connected}" disable-animate></i>
                <i ng-if="$ctrl.connecting && !$ctrl.connected" class="fad fa-sync fa-spin" disable-animate></i>
            </div>
            `,
            controller: function() {
                const $ctrl = this; // eslint-disable-line @typescript-eslint/no-unused-vars
            }
        });
}());
