"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("channelRewardsService", function($q, logger, backendCommunicator) {
            let service = {};

            service.channelRewards = [];

            service.selectedSortTag = null;

            service.searchQuery = "";

            function updateChannelReward(channelReward) {
                const index = service.channelRewards.findIndex(r => r.id === channelReward.id);
                if (index > -1) {
                    service.channelRewards[index] = channelReward;
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

            backendCommunicator.on("channel-reward-updated", (channelReward) => {
                updateChannelReward(channelReward);
            });

            return service;
        });
}());
