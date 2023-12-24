"use strict";

(function() {
    angular.module("firebotApp")
        .component("loginsModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" aria-label="Close" ng-click="$ctrl.goBack()"><span aria-hidden="true">&times;</span></button>
                    <h3 class="modal-title" style="text-transform: capitalize">Twitch Logins</h3>
                </div>
                <div class="modal-body">
                    <div ng-if="$ctrl.dcfAccount == null" class="mb-3">
                        <twitch-account type="streamer" connect-disconnect-click="$ctrl.onConnectOrDisconnectClicked(type)" invalid="$ctrl.invalidAccounts['streamer']" />
                        <twitch-account type="bot" connect-disconnect-click="$ctrl.onConnectOrDisconnectClicked(type)" invalid="$ctrl.invalidAccounts['bot']" />
                    </div>
                    <div ng-if="$ctrl.dcfAccount != null">
                        <dcf-code-display type="{{$ctrl.dcfAccount}}" on-complete-or-close="$ctrl.onDcfCompleteOrClose()" />
                    </div>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(accountAccess, connectionService, backendCommunicator) {
                const $ctrl = this;
                $ctrl.dcfAccount = null;

                $ctrl.invalidAccounts = {};

                $ctrl.$onInit = function() {
                    $ctrl.invalidAccounts = $ctrl.resolve.invalidAccounts;
                };

                $ctrl.onConnectOrDisconnectClicked = function(type) {
                    if (accountAccess.accounts[type].loggedIn) {
                        return connectionService.logout(type);
                    }
                    $ctrl.dcfAccount = type;
                };

                $ctrl.onDcfCompleteOrClose = function() {
                    $ctrl.dcfAccount = null;
                };

                $ctrl.goBack = function() {
                    backendCommunicator.send("cancel-device-token-check");
                    $ctrl.dismiss();
                };
            }
        });
}());
