import type { ReplaceVariable } from "../../../../types/variables";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";

const model : ReplaceVariable = {
    definition: {
        handle: "userBio",
        aliases: ["userAbout", "userDescription"],
        usage: "userBio",
        description: "Gets the bio/description of the associated user (ie who triggered command, pressed button, etc).",
        examples: [
            {
                usage: "userBio[$target]",
                description: "When in a command, gets the the bio/description of the target user."
            },
            {
                usage: "userBio[ebiggz]",
                description: "Gets the bio/description of a specific user."
            }
        ],
        categories: ["user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger, username: string) => {
        if (username == null) {
            username = trigger.metadata.username;
        }

        try {
            const userInfo = await TwitchApi.users.getUserByName(username);
            return userInfo.description ? userInfo.description : "[No Description Found]";
        } catch {
            return "[No Description Found]";
        }
    }
};

export default model;