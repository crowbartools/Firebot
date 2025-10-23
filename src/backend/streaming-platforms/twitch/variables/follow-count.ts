import type { ReplaceVariable } from "../../../../types/variables";
import { AccountAccess } from "../../../common/account-access";
import { TwitchApi } from "../api";

const model: ReplaceVariable = {
    definition: {
        handle: "followCount",
        description: "The number of follows you currently have.",
        examples: [
            {
                usage: "followCount[$target]",
                description: "When in a command, gets the follow count for the target user."
            },
            {
                usage: "followCount[$user]",
                description: "Gets the follow count for associated user (Ie who triggered command, pressed button, etc)."
            },
            {
                usage: "followCount[ChannelOne]",
                description: "Gets the follow count for a specific channel."
            }
        ],
        categories: ["numbers", "user based"],
        possibleDataOutput: ["number"]
    },
    evaluator: async (trigger, username: string) => {
        let count = 0;

        const streamer = AccountAccess.getAccounts().streamer;

        if (username == null) {
            username = streamer.username;
        }

        try {
            const user = await TwitchApi.users.getUserByName(username);

            const response = await TwitchApi.streamerClient.channels.getChannelFollowerCount(user.id);
            count = response ?? 0;
        } catch {
            // silently fail
        }

        return count;
    }
};

export default model;