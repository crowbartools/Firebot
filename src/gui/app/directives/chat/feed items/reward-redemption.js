"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("rewardRedemption", {
            bindings: {
                redemption: "<"
            },
            template: `
                <div class="reward-redemption" ng-class="{ isHighlight: $ctrl.redemption.id === 'highlight-message' }">
                    <img ng-src="{{$ctrl.rewardImageUrl}}" />
                    <b>{{$ctrl.redemption.user.displayName}}{{($ctrl.redemption.user.displayName.toLowerCase() !== $ctrl.redemption.user.username.toLowerCase() ? " (" + $ctrl.redemption.user.username + ")" : "")}}</b> <span>redeemed</span> <b>{{$ctrl.redemption.reward.name}}</b>
                </div>
            `,
            controller: function() {
                const $ctrl = this;

                $ctrl.rewardImageUrl = "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png";

                $ctrl.$onInit = () => {
                    if ($ctrl.redemption.reward.imageUrl) {
                        $ctrl.rewardImageUrl = $ctrl.redemption.reward.imageUrl;
                    }
                };
            }
        });
}());
