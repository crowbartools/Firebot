"use strict";

(function() {
    angular.module("firebotApp")
        .component("twitchLoginModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" aria-label="Close" ng-click="$ctrl.close()"><span aria-hidden="true">&times;</span></button>
                    <h3 class="modal-title" style="text-transform: capitalize">Twitch {{$ctrl.accountType}} Account Login</h3>
                </div>
                <div class="modal-body">
                    <div ng-if="$ctrl.loaded === false">
                        <div class="loader">Loading...</div>
                    </div>
                    <div style="text-align:center;" ng-if="$ctrl.loaded === true">
                        <h4 class="mb-8">Let's get you logged into your <strong>{{$ctrl.accountType}}</strong> account!</h4>
                        <p class="muted">
                            Please copy the below URL and paste it into a browser window to login to your Twitch <strong>{{$ctrl.accountType}}</strong> account.
                            <span ng-if="$ctrl.accountType && $ctrl.accountType === 'bot'">When logging into your bot account, you may want to use an Incognito window. This avoids unintentionally logging in with your streamer account.</span>
                        </p>
                        <p class="muted">When you login, please enter or verify the code below:</p>
                        <h2 class="my-8" style="letter-spacing: 0.3em">{{$ctrl.code}}</h2>
                        <div class="input-group">
                            <input type="text" class="form-control" style="cursor:text;" ng-model="$ctrl.loginUrl" disabled>
                            <span class="input-group-btn">
                                <button class="btn btn-primary" type="button" ng-click="$ctrl.copy()">Copy</button>
                            </span>
                        </div>
                        <div class="muted mt-5">Once you log in to Twitch and authorize Firebot, you can return here and this dialog will close automatically.</div>
                    </div>
                </div>
                <div class="modal-footer"></div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($rootScope, ngToast, backendCommunicator) {
                const $ctrl = this;
                $ctrl.loaded = false;

                backendCommunicator.on("device-code-received", (details) => {
                    $ctrl.loaded = true;
                    $ctrl.loginUrl = details.loginUrl;
                    $ctrl.code = details.code;
                });

                backendCommunicator.on("accountUpdate", accounts => {
                    switch ($ctrl.accountType) {
                        case "streamer":
                            if (accounts.streamer.loggedIn) {
                                $ctrl.dismiss();
                            }
                            break;
                        case "bot":
                            if (accounts.bot.loggedIn) {
                                $ctrl.dismiss();
                            }
                            break;
                        default:
                            break;
                    }
                });

                $ctrl.loginUrl = "https://www.twitch.tv/activate";
                $ctrl.code = "";

                $ctrl.copy = function() {
                    $rootScope.copyTextToClipboard($ctrl.loginUrl);

                    ngToast.create({
                        className: 'success',
                        content: 'Twitch login URL copied!'
                    });
                };

                $ctrl.$onInit = function() {
                    $ctrl.accountType = $ctrl.resolve.accountType;

                    backendCommunicator.fireEventAsync("begin-device-auth", `twitch:${$ctrl.accountType}-account`);
                };
            }
        });
}());
