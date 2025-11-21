import type { ReplaceVariable } from "../../../../types/variables";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";

const model : ReplaceVariable = {
    definition: {
        handle: "userAvatarUrl",
        aliases: ["userProfileImageUrl"],
        usage: "userAvatarUrl",
        description: "Gets the url for the avatar of the associated user (Ie who triggered command, pressed button, etc).",
        examples: [
            {
                usage: "userAvatarUrl[$target]",
                description: "When in a command, gets the the url for the avatar of the target user."
            },
            {
                usage: "userAvatarUrl[ebiggz]",
                description: "Gets the url for the avatar of a specific user."
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
            return userInfo.profilePictureUrl ? userInfo.profilePictureUrl : "[No Avatar Found]";
        } catch {
            return "[No Avatar Found]";
        }
    }
};

export default model;