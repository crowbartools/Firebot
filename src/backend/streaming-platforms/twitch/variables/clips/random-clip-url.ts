import type { ReplaceVariable } from "../../../../../types/variables";
import { AccountAccess } from "../../../../common/account-access";
import { TwitchApi } from "../../api";

const model: ReplaceVariable = {
    definition: {
        handle: "randomClipUrl",
        description: "Gets a random Twitch clip URL.",
        examples: [
            {
                usage: "randomClipUrl",
                description: "Gets the URL for a random Twitch clip from the streamer's channel."
            },
            {
                usage: "randomClipUrl[username]",
                description: "Gets the URL for a random Twitch clip from the specified user's channel."
            }
        ],
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger, username: string) => {
        if (!username) {
            username = AccountAccess.getAccounts().streamer.username;
        }

        const clip = await TwitchApi.clips.getRandomClipForUserByName(username);
        return clip?.url ?? "";
    }
};

export default model;