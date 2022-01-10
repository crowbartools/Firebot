"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("channelRewardsService", function($q,
            backendCommunicator, utilityService, objectCopyHelper, ngToast) {
            let service = {};

            service.channelRewards = [];

            service.selectedSortTag = null;

            service.searchQuery = "";

            function updateChannelReward(channelReward) {
                const index = service.channelRewards.findIndex(r => r.id === channelReward.id);
                if (index > -1) {
                    service.channelRewards[index] = channelReward;
                } else {
                    service.channelRewards.push(channelReward);
                }
            }

            service.loadChannelRewards = () => {
                $q.when(backendCommunicator.fireEventAsync("getChannelRewards"))
                    .then(channelRewards => {
                        if (channelRewards) {
                            service.channelRewards = channelRewards;
                        }
                    });
            };

            service.saveChannelReward = (channelReward) => {
                return $q.when(backendCommunicator.fireEventAsync("saveChannelReward", channelReward))
                    .then(savedReward => {
                        if (savedReward) {
                            updateChannelReward(savedReward);
                            return true;
                        }
                        return false;
                    });
            };

            service.saveAllRewards = (channelRewards, updateTwitch = false) => {
                service.channelRewards = channelRewards;
                backendCommunicator.fireEvent("saveAllChannelRewards", {
                    updateTwitch: updateTwitch,
                    channelRewards: channelRewards
                });
            };

            service.deleteChannelReward = (channelRewardId) => {
                service.channelRewards = service.channelRewards.filter(cr => cr.id !== channelRewardId);
                backendCommunicator.fireEvent("deleteChannelReward", channelRewardId);
            };

            service.showAddOrEditRewardModal = (reward) => {
                utilityService.showModal({
                    component: "addOrEditChannelReward",
                    size: "md",
                    resolveObj: {
                        reward: () => reward
                    },
                    closeCallback: () => {}
                });
            };

            service.manuallyTriggerReward = (itemId) => {
                backendCommunicator.fireEvent("manuallyTriggerReward", itemId);
            };

            service.channelRewardNameExists = (name) => {
                return service.channelRewards.some(r => r.twitchData.title === name);
            };

            service.duplicateChannelReward = (rewardId) => {
                if (service.channelRewards.length >= 50) {
                    return;
                }

                const reward = service.channelRewards.find(r => r.id === rewardId);
                if (reward == null) {
                    return;
                }
                const copiedReward = objectCopyHelper.copyObject("channel_reward", reward);
                copiedReward.id = null;
                copiedReward.twitchData.id = null;
                copiedReward.manageable = true;

                while (service.channelRewardNameExists(copiedReward.twitchData.title)) {
                    copiedReward.twitchData.title += "copy";
                }

                copiedReward.twitchData.title = copiedReward.twitchData.title.substring(0, 45);

                service.saveChannelReward(copiedReward).then(successful => {
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

                $q.when(backendCommunicator.fireEventAsync("syncChannelRewards"))
                    .then(channelRewards => {
                        if (channelRewards) {
                            service.channelRewards = channelRewards;
                        }
                        currentlySyncing = false;
                    });
            };

            backendCommunicator.on("channel-reward-updated", (channelReward) => {
                updateChannelReward(channelReward);
            });

            return service;
        });
}());
