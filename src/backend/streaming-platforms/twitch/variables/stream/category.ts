import type { ReplaceVariable } from "../../../../../types/variables";
import { AccountAccess } from "../../../../common/account-access";
import { TwitchApi } from "../../api";

const model : ReplaceVariable = {
    definition: {
        handle: "category",
        aliases: ["game"],
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
        categories: ["common", "user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger, username: string) => {
        if (username == null) {
            username = AccountAccess.getAccounts().streamer.username;
        }

        const channelInfo = await TwitchApi.channels.getChannelInformationByUsername(username);

        return channelInfo?.gameName || "";
    }
};

export default model;