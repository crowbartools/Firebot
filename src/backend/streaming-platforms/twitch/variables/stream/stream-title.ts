import type { ReplaceVariable } from "../../../../../types/variables";
import { AccountAccess } from "../../../../common/account-access";
import { TwitchApi } from "../../api";

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
        categories: ["common", "user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger, username: string) => {
        if (username == null) {
            username = AccountAccess.getAccounts().streamer.username;
        }

        const channelInfo = await TwitchApi.channels.getChannelInformationByUsername(username);

        return channelInfo != null ? channelInfo.title : "[No channel found]";
    }
};

export default model;