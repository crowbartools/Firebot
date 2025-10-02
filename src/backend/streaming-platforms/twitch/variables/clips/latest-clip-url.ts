import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import accountAccess from "../../../../common/account-access";
import { TwitchApi } from "../../api";

const model: ReplaceVariable = {
    definition: {
        handle: "latestClipUrl",
        description: "(NOTE: Due to how the Twitch API works, this can take several seconds and the clip may not be the very latest.) Gets the URL for the most recent Twitch clip.",
        examples: [
            {
                usage: "latestClipUrl",
                description: "Gets the URL for the latest Twitch clip from the streamer's channel."
            },
            {
                usage: "latestClipUrl[username]",
                description: "Gets the URL for the latest Twitch clip from the specified user's channel."
            }
        ],
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, username: string) => {
        if (!username) {
            username = accountAccess.getAccounts().streamer.username;
        }

        const clip = await TwitchApi.clips.getLatestClipForUserByName(username);
        return clip?.url ?? "";
    }
};

export default model;