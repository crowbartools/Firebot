"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("queueRewardItem", {
            bindings: {
                rewardId: "@",
                redemptionCount: "<",
                selected: "<"
            },
            template: `
                <queue-reward-wrapper selected="$ctrl.selected">
                    <div class="queue-reward-item">
                        <img
                            ng-src="{{$ctrl.reward.twitchData.image.url4x}}"
                            class="queue-reward-image"
                            ng-style="{ 'background-color': $ctrl.reward.twitchData.backgroundColor || 'gray' }"
                        >
                        <div>
                            <div style="font-weight: bold;">{{$ctrl.reward.twitchData.title}}</div>
                            <div>{{$ctrl.redemptionCount}} request{{$ctrl.redemptionCount !== 1 ? 's' : ''}}</div>
                        </div>
                    </div>
                </queue-reward-wrapper>
            `,
            controller: function($scope, channelRewardsService) {
                const $ctrl = this;

                $ctrl.$onInit = () => {
                    $ctrl.reward = channelRewardsService.channelRewards.find(r => r.id === $ctrl.rewardId);
                };

            }
        });
}());
