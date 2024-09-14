import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import { EffectTrigger } from "../../../../../shared/effect-constants";

import twitchApi from "../../../../twitch-api/api";
import roleHelpers from "../../../../roles/role-helpers";

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = true;
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.CUSTOM_SCRIPT] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.CHANNEL_REWARD] = true;

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
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.ALL]
    },
    evaluator: async (_trigger, username: string, role: string) => {
        if (username == null || username === "") {
            return false;
        }

        if (role == null || role === "") {
            return false;
        }

        try {
            const user = await twitchApi.users.getUserByName(username);
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
