"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const { getAllRolesForViewer } = require('../../roles/role-helpers');

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = true;
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.CUSTOM_SCRIPT] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.CHANNEL_REWARD] = true;

module.exports = {
    definition: {
        handle: "hasRoles",
        usage: "hasRoles[user, any|all, role, role2, ...]",
        description: "Returns true if the user has the specified roles. Only valid within $if",
        examples: [
            {
                usage: 'hasRoles[$user, any, mod, vip]',
                description: "returns true if $user is a mod OR VIP"
            },
            {
                usage: 'hasRoles[$user, all, mod, vip]',
                description: "Returns true if $user is a mod AND a VIP"
            }
        ],
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.ALL]
    },
    evaluator: async (trigger, username, respective, ...roles) => {
        if (username == null || username === '') {
            return false;
        }

        if (respective == null || respective === "") {
            return false;
        }

        if (roles == null || roles.length === 0) {
            return false;
        }

        respective = (respective + '').toLowerCase();
        if (respective !== 'any' && respective !== 'all') {
            return false;
        }

        const userRoles = await getAllRolesForViewer(username);

        // any
        if (respective === 'any') {
            return userRoles.some(r => roles.includes(r.name));
        }

        // all
        return roles.length === userRoles.filter(r => roles.includes(r.name)).length;
    }
};