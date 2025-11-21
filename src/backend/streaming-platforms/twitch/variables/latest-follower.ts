import type { ReplaceVariable } from "../../../../types/variables";
import { AccountAccess } from "../../../common/account-access";
import { TwitchApi } from "../api";

const model : ReplaceVariable = {
    definition: {
        handle: "latestFollower",
        description: "The Twitch user that was the last to follow the streamer's channel.",
        categories: ["common", "user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (_) => {
        const streamer = AccountAccess.getAccounts().streamer;

        if (streamer == null) {
            return "";
        }

        const followers = await TwitchApi.channels.getFollowers(1);

        return followers[0].userDisplayName || "";
    }
};

export default model;