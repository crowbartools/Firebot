import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const TwitchApi = require("../../../../twitch-api/api");
const accountAccess = require("../../../../common/account-access");

const model : ReplaceVariable = {
    definition: {
        handle: "category",
        description: "Gets the current category/game set for your channel",
        examples: [
            {
                usage: "category[$target]",
                description: "When in a command, gets the category/game set for the target user."
            },
            {
                usage: "category[$user]",
                description: "Gets the category/game set for associated user (i.e. who triggered command, pressed button, etc)."
            },
            {
                usage: "category[ChannelOne]",
                description: "Gets the category/game set for a specific channel."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, username) => {
        if (username == null) {
            username = accountAccess.getAccounts().streamer.username;
        }

        const channelInfo = await TwitchApi.channels.getChannelInformationByUsername(username);

        return channelInfo?.gameName || "";
    }
};

export default model;