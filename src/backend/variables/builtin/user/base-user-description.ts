import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const twitchApi = require("../../../twitch-api/api");

const baseUserDescriptionVar = (handle: string) : ReplaceVariable => ({
    definition: {
        handle,
        usage: handle,
        description: "Gets the description/bio of the associated user (Ie who triggered command, pressed button, etc).",
        examples: [
            {
                usage: `${handle}[$target]`,
                description: "When in a command, gets the the description/bio of the target user."
            },
            {
                usage: `${handle}[ebiggz]`,
                description: "Gets the description/bio of a specific user."
            }
        ],
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, username) => {
        if (username == null) {
            username = trigger.metadata.username;
        }

        try {
            const userInfo = await twitchApi.users.getUserByName(username);
            return userInfo.description ? userInfo.description : "[No Description Found]";
        } catch (err) {
            return "[No Description Found]";
        }
    }
});

export default baseUserDescriptionVar;