import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const twitchApi = require("../../../twitch-api/api");

const model : ReplaceVariable = {
    definition: {
        handle: "userBio",
        usage: "userBio",
        description: "Gets the description of the associated user (ie who triggered command, pressed button, etc).",
        examples: [
            {
                usage: "userBio[$target]",
                description: "When in a command, gets the the description of the target user."
            },
            {
                usage: "userBio[ebiggz]",
                description: "Gets the description of a specific user."
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
};

export default model;