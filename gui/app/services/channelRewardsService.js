"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("channelRewardsService", function($q, logger,
            backendCommunicator, utilityService) {
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

            backendCommunicator.on("channel-reward-updated", (channelReward) => {
                updateChannelReward(channelReward);
            });

            return service;
        });
}());
