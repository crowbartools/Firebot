import type { ReplaceVariable } from "../../../../types/variables";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";

const model : ReplaceVariable = {
    definition: {
        handle: "isUserInChat",
        usage: "isUserInChat[username]",
        description: "Outputs `true` if a user is currently connected to Twitch chat, `false` if not",
        categories: ["advanced"],
        possibleDataOutput: ["bool"]
    },
    evaluator: async (_, username: string) => {
        if (!username?.length) {
            return false;
        }

        username = username.toLowerCase();
        const chatters = await TwitchApi.chat.getAllChatters();

        return chatters?.some(c => c.userName === username || c.userDisplayName.toLowerCase() === username) ?? false;
    }
};

export default model;
