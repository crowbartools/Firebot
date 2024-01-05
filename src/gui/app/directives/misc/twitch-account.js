"use strict";

// <!-- <p class="text-center mt-4 muted px-10">{{$ctrl.descriptions[$ctrl.type]}}</p> -->

(function() {
    angular.module("firebotApp").component("twitchAccount", {
        bindings: {
            type: "@",
            connectDisconnectClick: "&",
            invalid: "<?"
        },
        template: `
          <div class="flex flex-col items-center">
            <h3 class="self-start font-bold capitalize">{{$ctrl.type}} <tooltip text="$ctrl.descriptions[$ctrl.type]" type="info" style="font-size:15px;"></tooltip></h3>
            <p ng-if="!$ctrl.getAccount().loggedIn && $ctrl.invalid" class="text-danger">This account was logged out because it was out of date. Please log back in to continue.</p>
            <div class="twitch-account flex justify-center items-center" ng-class="$ctrl.getAccount().loggedIn ? 'connected' : 'not-connected'" >
                <h4 ng-if="!$ctrl.getAccount().loggedIn" class="clickable" ng-click="$ctrl.connectDisconnectClick({ type : $ctrl.type })">
                    <i class="fal fa-plus-circle"></i> Connect Account
                </h4>
                <div ng-if="$ctrl.getAccount().loggedIn" class="flex items-center justify-between px-10" style="width: 100%">
                    <div class="flex items-center">
                        <img
                            class="login-thumbnail-large noselect"
                            ng-src="{{$ctrl.cs.getAccountAvatar($ctrl.type)}}"
                        />
                        <div class="ml-10">
                            <h3 class="font-bold" style="margin: 0;">{{$ctrl.getAccount().displayName}}</h3>
                            <h4 class="muted" style="margin: 0;">@{{$ctrl.getAccount().username}}</h4>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-danger" ng-click="$ctrl.connectDisconnectClick({ type : $ctrl.type })">Disconnect</button>
                    </div>
                </div>
            </div>
          </div>
          `,
        controller: function(accountAccess, connectionService) {
            const $ctrl = this;

            $ctrl.cs = connectionService;

            $ctrl.descriptions = {
                streamer: "The main account that Firebot uses to connect to Twitch services.",
                bot: "Optional secondary account that Firebot can use to send chat messages to your stream."
            };

            $ctrl.getAccount = () => {
                return accountAccess.accounts[$ctrl.type];
            };

            $ctrl.$onInit = function() {
            };
        }
    });
}());
