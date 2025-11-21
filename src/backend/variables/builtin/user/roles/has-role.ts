import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

import { TwitchApi } from "../../../../streaming-platforms/twitch/api";
import roleHelpers from "../../../../roles/role-helpers";

const triggers: TriggersObject = {};
triggers["command"] = true;
triggers["event"] = true;
triggers["manual"] = true;
triggers["custom_script"] = true;
triggers["preset"] = true;
triggers["channel_reward"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "hasRole",
        usage: "hasRole[user, role]",
        description: "Returns true if the user has the specified role. Only valid within `$if`",
        examples: [
            {
                usage: "hasRole[user, Moderator]",
                description: "Returns true if user is a mod"
            },
            {
                usage: "hasRole[user, VIP]",
                description: "Returns true if user is a VIP"
            }
        ],
        triggers: triggers,
        categories: ["common", "user based"],
        possibleDataOutput: ["ALL"]
    },
    evaluator: async (_trigger, username: string, role: string) => {
        if (username == null || username === "") {
            return false;
        }

        if (role == null || role === "") {
            return false;
        }

        try {
            const user = await TwitchApi.users.getUserByName(username);
            if (user == null) {
                return false;
            }

            return await roleHelpers.viewerHasRoleByName(user.id, role);
        } catch {
            // Silently fail
        }

        return false;
    }
};
export default model;
