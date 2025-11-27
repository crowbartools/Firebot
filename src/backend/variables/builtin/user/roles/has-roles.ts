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
        handle: "hasRoles",
        usage: "hasRoles[user, any|all, role, role2, ...]",
        description: "Returns true if the user has the specified roles. Only valid within `$if`",
        examples: [
            {
                usage: "hasRoles[$user, any, Moderator, VIP]",
                description: "returns true if $user is a mod OR VIP"
            },
            {
                usage: "hasRoles[$user, all, Moderator, VIP]",
                description: "Returns true if $user is a mod AND a VIP"
            }
        ],
        triggers: triggers,
        categories: ["common", "user based"],
        possibleDataOutput: ["ALL"]
    },
    evaluator: async (_trigger, username: string, respective, ...roles) => {
        if (username == null || username === "") {
            return false;
        }

        if (respective == null || respective === "") {
            return false;
        }

        if (roles == null || roles.length === 0) {
            return false;
        }

        respective = (`${respective}`).toLowerCase();
        if (respective !== "any" && respective !== "all") {
            return false;
        }

        try {
            const user = await TwitchApi.users.getUserByName(username);
            if (user == null) {
                return false;
            }

            const userRoles = await roleHelpers.getAllRolesForViewer(user.id);

            // any
            if (respective === "any") {
                return userRoles.some(r => roles.includes(r.name));
            }

            // all
            return roles.length === userRoles.filter(r => roles.includes(r.name)).length;
        } catch {
            // Silently fail
        }

        return false;
    }
};

export default model;
