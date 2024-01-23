import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const TwitchApi = require("../../../../twitch-api/api");
const accountAccess = require("../../../../common/account-access");

const model : ReplaceVariable = {
    definition: {
        handle: "streamTitle",
        usage: "streamTitle",
        description: "Gets the current stream title for your channel",
        examples: [
            {
                usage: "streamTitle[$target]",
                description: "When in a command, gets the stream title for the target channel."
            },
            {
                usage: "streamTitle[$user]",
                description: "Gets the stream title  for associated user (Ie who triggered command, pressed button, etc)."
            },
            {
                usage: "streamTitle[ebiggz]",
                description: "Gets the stream title for a specific channel."
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

        return channelInfo != null ? channelInfo.title : "[No channel found]";
    }
};

export default model;