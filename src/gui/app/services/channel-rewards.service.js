"use strict";

(function () {

    angular
        .module("firebotApp")
        .factory("channelRewardsService", function ($q,
            backendCommunicator, utilityService, objectCopyHelper, ngToast) {
            const service = {};

            service.channelRewards = [];
            service.redemptions = {};

            service.selectedSortTag = null;

            service.searchQuery = "";

            /**
             * Returns the count of rewards that actually exist on Twitch
             * (excludes locally-disabled rewards that have been deleted from Twitch).
             */
            service.getActiveRewardCount = () => {
                return service.channelRewards.filter(r => !r.deletedOnTwitch).length;
            };

            function updateChannelReward(channelReward) {
                const index = service.channelRewards.findIndex(r => r.firebotId === channelReward.firebotId);
                if (index > -1) {
                    service.channelRewards[index] = channelReward;
                } else {
                    service.channelRewards.push(channelReward);
                }
            }

            service.loadChannelRewards = () => {
                service.channelRewards = backendCommunicator.fireEventSync("get-channel-rewards");

                service.userIsEligible = backendCommunicator.fireEventSync("get-channel-rewards-eligibility");
            };

            service.saveChannelReward = (channelReward) => {
                return $q.when(backendCommunicator.fireEventAsync("save-channel-reward", channelReward))
                    .then((savedReward) => {
                        if (savedReward) {
                            updateChannelReward(savedReward);
                            return true;
                        }
                        return false;
                    });
            };

            service.saveAllRewards = (channelRewards, updateTwitch = false) => {
                service.channelRewards = channelRewards;
                backendCommunicator.fireEvent("save-all-channel-rewards", {
                    updateTwitch: updateTwitch,
                    channelRewards: channelRewards
                });
            };

            service.deleteChannelReward = (firebotId) => {
                service.channelRewards = service.channelRewards.filter(cr => cr.firebotId !== firebotId);
                backendCommunicator.fireEvent("delete-channel-reward", firebotId);
            };

            service.showAddOrEditRewardModal = (reward) => {
                utilityService.showModal({
                    component: "addOrEditChannelReward",
                    windowClass: "no-padding-modal",
                    resolveObj: {
                        reward: () => reward
                    },
                    closeCallback: () => { }
                });
            };

            service.manuallyTriggerReward = (itemId) => {
                backendCommunicator.fireEvent("manually-trigger-reward", itemId);
            };

            service.channelRewardNameExists = (name) => {
                return service.channelRewards.some(r => r.twitchData.title === name);
            };

            service.duplicateChannelReward = (firebotId) => {
                if (service.getActiveRewardCount() >= 50) {
                    return;
                }

                const reward = service.channelRewards.find(r => r.firebotId === firebotId);
                if (reward == null) {
                    return;
                }
                const copiedReward = objectCopyHelper.copyObject("channel_reward", reward);
                copiedReward.id = null;
                copiedReward.firebotId = null;
                copiedReward.twitchData.id = null;
                copiedReward.manageable = true;
                copiedReward.deletedOnTwitch = false;
                copiedReward.previousTwitchIds = [];

                while (service.channelRewardNameExists(copiedReward.twitchData.title)) {
                    copiedReward.twitchData.title += "copy";
                }

                copiedReward.twitchData.title = copiedReward.twitchData.title.substring(0, 45);

                service.saveChannelReward(copiedReward).then((successful) => {
                    if (successful) {
                        ngToast.create({
                            className: 'success',
                            content: 'Successfully duplicated a channel reward!'
                        });
                    } else {
                        ngToast.create("Unable to duplicate channel reward.");
                    }
                });
            };

            let currentlySyncing = false;
            service.syncChannelRewards = () => {
                if (currentlySyncing) {
                    return;
                }

                currentlySyncing = true;

                $q.when(backendCommunicator.fireEventAsync("sync-channel-rewards"))
                    .then((channelRewards) => {
                        if (channelRewards) {
                            service.channelRewards = channelRewards;
                        }
                        currentlySyncing = false;
                    });
            };

            service.loadingRedemptions = false;
            service.refreshChannelRewardRedemptions = () => {
                if (service.loadingRedemptions) {
                    return;
                }

                service.loadingRedemptions = true;

                $q.when(backendCommunicator.fireEventAsync("refresh-channel-reward-redemptions"))
                    .then(() => {
                        service.loadingRedemptions = false;
                    });
            };

            service.getRewardIdsWithRedemptions = () => {
                return Object.entries(service.redemptions)
                    .filter(([, redemptions]) => redemptions.length > 0)
                    .map(([rewardId]) => rewardId);
            };

            service.approveOrRejectChannelRewardRedemptions = (rewardId, redemptionIds, approve = true) => {
                return $q.when(backendCommunicator.fireEventAsync("approve-reject-channel-reward-redemptions", {
                    rewardId,
                    redemptionIds,
                    approve
                }));
            };

            service.approveOrRejectAllRedemptionsForChannelRewards = (rewardIds, approve = true) => {
                return $q.when(backendCommunicator.fireEventAsync("approve-reject-channel-all-redemptions-for-rewards", {
                    rewardIds,
                    approve
                }));
            };

            backendCommunicator.on("channel-rewards-updated", (channelRewards) => {
                service.channelRewards = channelRewards;
            });

            backendCommunicator.on("channel-rewards-eligibility-changed", (eligible) => {
                service.userIsEligible = eligible;
            });

            backendCommunicator.on("channel-reward-updated", (channelReward) => {
                updateChannelReward(channelReward);
            });

            backendCommunicator.on("channel-reward-deleted", (firebotId) => {
                service.channelRewards = service.channelRewards.filter(cr => cr.firebotId !== firebotId);
                delete service.redemptions[firebotId];
            });

            backendCommunicator.on("channel-reward-redemptions-updated", (redemptions) => {
                service.loadingRedemptions = false;
                service.redemptions = redemptions;
            });

            return service;
        });
}());
