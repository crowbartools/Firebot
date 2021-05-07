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
                updateChannelReward(channelReward);
                backendCommunicator.fireEvent("saveChannelReward", channelReward);
            };

            service.saveAllRewards = (channelRewards, updateTwitch = false) => {
                service.channelRewards = channelRewards;
                backendCommunicator.fireEvent("saveAllChannelRewards", {
                    updateTwitch: updateTwitch,
                    channelRewards: channelRewards
                });
            };

            service.showAddOrEditRewardModal = (reward) => {
                utilityService.showModal({
                    component: "addOrEditChannelReward",
                    size: "md",
                    resolveObj: {
                        reward: () => reward
                    },
                    closeCallback: ({action, reward}) => {

                        switch (action) {
                        case "add":
                        case "update":
                            service.saveChannelReward(reward);
                            break;
                        case "delete":
                            //commandsService.deleteCustomCommand(command);
                            break;
                        }
                    }
                });
            };

            backendCommunicator.on("channel-reward-updated", (channelReward) => {
                updateChannelReward(channelReward);
            });

            return service;
        });
}());
