import type { ReplaceVariable } from "../../../../../types/variables";
import { AccountAccess } from "../../../../common/account-access";
import { TwitchApi } from "../../api";
import channelRewardManager from "../../../../channel-rewards/channel-reward-manager";


const model : ReplaceVariable = {
    definition: {
        handle: "rewardCost",
        description: "The channel point cost of the reward",
        examples: [
            {
                usage: "rewardCost[rewardName]",
                description: "The channel point cost of the given reward. Name must be exact!"
            }
        ],
        categories: ["common"],
        possibleDataOutput: ["number"]
    },
    evaluator: async (trigger, rewardName: string) => {
        let rewardData;
        if (!rewardName) {
            rewardData = trigger.metadata.eventData ?
                trigger.metadata.eventData :
                trigger.metadata;
        } else {
            const channelRewardId = channelRewardManager.getChannelRewardIdByName(rewardName);

            if (channelRewardId == null) {
                return -1;
            }

            const reward = await TwitchApi.streamerClient.channelPoints.getCustomRewardById(
                AccountAccess.getAccounts().streamer.userId,
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

export default model;
