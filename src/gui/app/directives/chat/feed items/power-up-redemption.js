"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("powerUpRedemption", {
            bindings: {
                redemption: "<"
            },
            template: `
                <div class="power-up-redemption">
                    <img ng-src="{{$ctrl.powerUpImageUrl}}" />
                    <b>{{$ctrl.redemption.user.displayName}}{{($ctrl.redemption.user.displayName.toLowerCase() !== $ctrl.redemption.user.username.toLowerCase() ? " (" + $ctrl.redemption.user.username + ")" : "")}}</b> <span>redeemed</span> <b>{{$ctrl.redemption.powerUp.name}}</b>
                </div>
            `,
            controller: function() {
                const $ctrl = this;

                $ctrl.powerUpImageUrl = "https://static-cdn.jtvnw.net/twilight-static-assets/Default-Power-up-Line-Lightshade-112x112.png";

                $ctrl.$onInit = () => {
                    if ($ctrl.redemption.powerUp.imageUrl) {
                        $ctrl.powerUpImageUrl = $ctrl.redemption.powerUp.imageUrl;
                    }
                };
            }
        });
}());
