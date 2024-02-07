import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import api from "../../../twitch-api/api";
import accountAccess from "../../../common/account-access";

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
        categories: [VariableCategory.NUMBERS, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger, username: string) => {
        let count = 0;

        const streamer = accountAccess.getAccounts().streamer;

        if (username == null) {
            username = streamer.username;
        }

        try {
            const user = await api.users.getUserByName(username);

            const response = await api.streamerClient.channels.getChannelFollowerCount(user.id);
            count = response ?? 0;
        } catch {
            // silently fail
        }

        return count;
    }
};

export default model;