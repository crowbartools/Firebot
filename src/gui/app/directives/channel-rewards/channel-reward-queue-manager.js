"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("channelRewardQueueManager", {
            bindings: {},
            template: `
            <div class="queue-manager-container">
                <div
                    ng-if="channelRewardsService.loadingRedemptions"
                    class="queue-loader-overlay">
                    <div>Loading requests...</div>
                </div>
                <div class="queue-manager-content">
                    <div class="queue-rewards-column">
                        <queue-reward-wrapper
                            selected="selectedReward == null"
                            ng-click="setSelectedReward(null)"
                        >
                            <span>All requests ({{totalRedemptionsCount()}})</span>
                        </queue-reward-wrapper>
                        <queue-reward-item
                            ng-repeat="(rewardId, redemptions) in channelRewardsService.redemptions | hideEmptyRewardQueues track by rewardId"
                            reward-id="{{rewardId}}"
                            redemption-count="redemptions.length"
                            selected="selectedReward == rewardId"
                            ng-click="setSelectedReward(rewardId)"
                        >
                        </queue-reward-item>
                    </div>
                    <div class="queue-redemptions-column">
                       <div class="queue-redemptions-list">
                        <queue-redemption-item
                            ng-repeat="redemption in getRedemptions() | orderBy: 'redemptionDate':true track by redemption.id"
                            redemption="redemption"
                            show-reward-name="selectedReward == null"
                        />
                       </div>
                       <div class="queue-footer">
                          <firebot-button
                                text="Complete All"
                                size="small"
                                icon="fa-check"
                                ng-click="approveOrRejectAll(true)"
                                loading="isLoading"
                                disabled="isLoading || !hasRedemptions()"
                            />
                            <firebot-button
                                text="Reject All"
                                type="danger"
                                size="small"
                                icon="fa-times"
                                ng-click="approveOrRejectAll(false)"
                                loading="isLoading"
                                disabled="isLoading || !hasRedemptions()"
                            />
                       </div>
                    </div>
                </div>
            </div>
            `,
            controller: function($scope, channelRewardsService, utilityService) {
                $scope.channelRewardsService = channelRewardsService;

                $scope.selectedReward = null;

                $scope.setSelectedReward = (rewardId) => {
                    $scope.selectedReward = rewardId;
                };

                $scope.getRedemptions = () => {
                    if ($scope.selectedReward == null) {
                        return Object.values(channelRewardsService.redemptions).flat();
                    }
                    return channelRewardsService.redemptions[$scope.selectedReward] || [];
                };

                $scope.hasRedemptions = () => $scope.getRedemptions().length > 0;

                $scope.totalRedemptionsCount = () => Object.values(channelRewardsService.redemptions).reduce((acc, redemptions) => acc + redemptions.length, 0);

                $scope.approveOrRejectAll = (approve = false) => {
                    utilityService
                        .showConfirmationModal({
                            title: approve ? "Complete All Requests" : "Reject All Requests",
                            question: `Are you sure you want to ${approve ? "complete" : "reject"} all requests?`,
                            confirmLabel: approve ? "Complete All" : "Reject All",
                            confirmBtnType: approve ? "btn-info" : "btn-danger"
                        })
                        .then((confirmed) => {
                            if (confirmed) {
                                $scope.isLoading = true;
                                channelRewardsService.approveOrRejectAllRedemptionsForChannelRewards(
                                    $scope.selectedReward == null ? channelRewardsService.getRewardIdsWithRedemptions() : [$scope.selectedReward],
                                    approve
                                ).then(() => {
                                    $scope.isLoading = false;
                                });
                            }
                        });
                };
            }
        });
}());
