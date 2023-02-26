"use strict";


const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rewardCost",
        description: "The channel point cost of the reward",
        examples: [
            {
                usage: "rewardCost[rewardName]",
                description: "The channel point cost of the given reward. Name must be exact!"
            }
        ],
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger, rewardName) => {
        let rewardData;
        if (!rewardName) {
            rewardData = trigger.metadata.eventData ?
                trigger.metadata.eventData :
                trigger.metadata;
        } else {
            const channelRewardManager = require("../../channel-rewards/channel-reward-manager");
            const twitchApi = require("../../twitch-api/api");
            const accountAccess = require("../../common/account-access");

            const channelRewardId = channelRewardManager.getChannelRewardIdByName(rewardName);

            if (channelRewardId == null) {
                return -1;
            }

            const reward = await twitchApi.streamerClient.channelPoints.getCustomRewardById(
                accountAccess.getAccounts().streamer.userId,
                channelRewardId
            );
            if (reward) {
                rewardData = {
                    rewardImage: reward.getImageUrl(4),
                    rewardName: reward.title,
                    rewardDescription: reward.prompt,
                    rewardCost: reward.cost
                };
            }
        }

        if (rewardData == null) {
            return -1;
        }

        return rewardData.rewardCost;
    }
};

module.exports = model;
