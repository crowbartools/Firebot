import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import { EffectTrigger } from '../../../../../shared/effect-constants';

import userRoles from './user-roles';

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = true;
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.CUSTOM_SCRIPT] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.CHANNEL_REWARD] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "rawUserRoles",
        description: "(Deprecated: use $userRoles) Returns all roles of the user as a raw array",
        usage: "rawUserRoles[username, all|twitch|team|firebot|custom]",
        examples: [
            {
                usage: 'rawUserRoles',
                description: "Returns all roles for the user"
            },
            {
                usage: 'rawUserRoles[$user]',
                description: "Returns all roles of the specified user"
            },
            {
                usage: 'rawUserRoles[$user, all]',
                description: "Returns all roles of the specified user as nested arrays in the order of: twitch, team, firebot and custom roles"
            },
            {
                usage: 'rawUserRoles[$user, firebot]',
                description: "Returns all firebot roles of the specified user"
            },
            {
                usage: 'rawUserRoles[$user, custom]',
                description: "Returns all custom roles of the specified user"
            },
            {
                usage: 'rawUserRoles[$user, twitch]',
                description: "Returns all Twitch roles of the specified user"
            },
            {
                usage: 'rawUserRoles[$user, team]',
                description: "Returns all Twitch team roles of the specified user"
            }
        ],
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.ALL]
    },
    evaluator: userRoles.evaluator
};

export default model;