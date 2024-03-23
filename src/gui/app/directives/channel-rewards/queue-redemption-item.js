"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("queueRedemptionItem", {
            bindings: {
                redemption: "<",
                showRewardName: "<"
            },
            template: `
                <div class="queue-redemption-item">
                    <div style="display:flex;">
                        <div style="flex-basis: 50%;">
                            <div ng-if="$ctrl.showRewardName" class="queue-reward-name">{{$ctrl.reward.twitchData.title}}</div>
                            <div>
                                {{$ctrl.redemption.userDisplayName}}{{($ctrl.redemption.userDisplayName.toLowerCase() !== $ctrl.redemption.userName.toLowerCase() ? " (" + $ctrl.redemption.userName + ")" : "")}}
                            </div>
                            <div>
                                <span uib-tooltip="{{$ctrl.redemption.redemptionDate | date: 'medium'}}" tooltip-append-to-body="true" class="muted">{{$ctrl.redemption.redemptionDate | timeFromNow }}</span>
                            </div>
                        </div>
                        <div style="flex-basis: 50%; text-align: right;">
                            <firebot-button
                                text="Mark as Complete"
                                size="small"
                                icon="fa-check"
                                ng-click="$ctrl.approveOrReject(true)"
                                loading="$ctrl.isLoading"
                                disabled="$ctrl.isLoading"
                            />
                            <firebot-button
                                text="Reject"
                                size="small"
                                icon="fa-times"
                                ng-click="$ctrl.approveOrReject(false)"
                                loading="$ctrl.isLoading"
                                disabled="$ctrl.isLoading"
                                tooltip="Refund points back to user"
                                tooltip-placement="top-right"
                            />
                        </div>
                    </div>
                    <div ng-if="$ctrl.redemption.rewardMessage" style="border-left: 4px solid gray; padding-left: 5px;">
                        <em>{{$ctrl.redemption.rewardMessage}}</em>
                    </div>
                </div>
            `,
            controller: function(channelRewardsService) {
                const $ctrl = this;

                $ctrl.$onInit = () => {
                    $ctrl.reward = channelRewardsService.channelRewards.find(r => r.id === $ctrl.redemption.rewardId);
                };

                $ctrl.approveOrReject = (approve = false) => {
                    $ctrl.isLoading = true;
                    channelRewardsService.approveOrRejectChannelRewardRedemptions($ctrl.redemption.rewardId, [$ctrl.redemption.id], approve).then(() => {
                        $ctrl.isLoading = false;
                    });
                };
            }
        });
}());
