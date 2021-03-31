"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("channelRewardsService", function($q, logger, backendCommunicator) {
            let service = {};

            service.channelRewards = [];

            service.loadChannelRewards = () => {
                $q.when(backendCommunicator.fireEventAsync("get-saved-channel-rewards"))
                    .then(channelRewards => {
                        if (channelRewards) {
                            service.channelRewards = channelRewards;
                        }
                    });
            };

            backendCommunicator.on("channel-rewards-updated", (channelRewards) => {
                if (channelRewards) {
                    service.channelRewards = channelRewards;
                }
            });

            return service;
        });
}());
