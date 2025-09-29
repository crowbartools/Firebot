import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import { ReplaceVariable } from "../../../../../types/variables";
import logger from "../../../../logwrapper";
import twitchStreamInfoManager from "../../../../twitch-api/stream-info-manager";

const TwitchApi = require("../../../../twitch-api/api");

const model : ReplaceVariable = {
    definition: {
        handle: "isChannelLive",
        usage: "isChannelLive",
        description: "Outputs `true` if the Twitch channel is currently live, `false` if not",
        examples: [
            {
                usage: "isChannelLive[$target]",
                description: "When in a command, gets whether the associated user's channel is live."
            },
            {
                usage: "isChannelLive[$user]",
                description: "Gets whether the associated user's channel is live (Ie who triggered command, pressed button, etc)."
            },
            {
                usage: "isChannelLive[Oceanity]",
                description: "Gets whether a specific channel is live."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_trigger, username) => {
        if (!username) {
            return twitchStreamInfoManager.streamInfo.isLive;
        }

        let stream;

        try {
            stream = await TwitchApi.streamerClient.streams.getStreamByUserName(username);
        } catch (error) {
            logger.debug(`Unable to find channel with username "${username}"`, error);
            return "[Channel not Found]";
        }

        return !!stream;
    }
};

export default model;