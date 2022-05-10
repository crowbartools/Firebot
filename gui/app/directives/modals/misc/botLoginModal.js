"use strict";

(function() {
    angular.module("firebotApp")
        .component("botLoginModal", {
            template: `
                <div class="modal-header" style="text-align:center;">
                    <h4 class="modal-title">Bot Account Login</h4>
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                </div>
                <div class="modal-body">
                    <div style="text-align:center;">
                        <p class="muted">Please copy the below URL and paste it into an incognito window. This avoids unintentionally logging in with your streamer account.</p>
                        <div class="input-group">
                            <input type="text" class="form-control" style="cursor:text;" ng-model="$ctrl.botLoginUrl" disabled>
                            <span class="input-group-btn">
                                <button class="btn btn-primary" type="button" ng-click="$ctrl.copy()">Copy</button>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer"></div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($rootScope, settingsService, ngToast, backendCommunicator) {
                const $ctrl = this;

                backendCommunicator.on("accountUpdate", accounts => {
                    if (accounts.bot.loggedIn) {
                        $ctrl.dismiss();
                    }
                });

                $ctrl.botLoginUrl = `http://localhost:${settingsService.getWebServerPort()}/api/v1/auth?providerId=${encodeURIComponent("twitch:bot-account")}`;

                $ctrl.copy = function() {
                    $rootScope.copyTextToClipboard($ctrl.botLoginUrl);

                    ngToast.create({
                        className: 'success',
                        content: 'Bot login url copied!'
                    });
                };
            }
        });
}());
