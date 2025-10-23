import type { ReplaceVariable } from "../../../../../types/variables";
import { TwitchApi } from "../../api";
import twitchStreamInfoManager from "../../stream-info-manager";
import logger from "../../../../logwrapper";


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
        categories: ["common", "user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (_trigger, username: string) => {
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