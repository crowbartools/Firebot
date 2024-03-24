import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import twitchApi from "../../../twitch-api/api";

const model : ReplaceVariable = {
    definition: {
        handle: "isUserInChat",
        usage: "isUserInChat[username]",
        description: "Outputs `true` if a user is currently connected to Twitch chat, `false` if not",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.BOOLEAN]
    },
    evaluator: async (_, username: string) => {
        if (!username?.length) {
            return false;
        }

        username = username.toLowerCase();
        const chatters = await twitchApi.chat.getAllChatters();

        return chatters?.some(c => c.userName === username || c.userDisplayName.toLowerCase() === username) ?? false;
    }
};

export default model;
