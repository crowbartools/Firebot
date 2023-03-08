"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const { getAllRolesForViewerNameSpaced } = require('../../roles/role-helpers');

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = true;
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.CUSTOM_SCRIPT] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.CHANNEL_REWARD] = true;

module.exports = {
    definition: {
        handle: "rawUserRoles",
        usage: "rawUserRoles[username, all|firebot|custom|twitch|team]",
        description: "Returns all roles of the user as a raw array",
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
                description: "Returns all roles of the specified user"
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
    evaluator: async (trigger, username, roleType) => {
        if (username == null && roleType == null) {
            username = trigger.metadata.username;
            roleType = 'all';
        }

        if (username == null || username === '') {
            return [];
        }

        if (roleType == null || roleType === "") {
            roleType = 'all';
        } else {
            roleType = (roleType + '').toLowerCase();
        }

        const userRoles = await getAllRolesForViewerNameSpaced(username);

        Object.keys(userRoles).forEach(key => {
            userRoles[key] = userRoles[key].map(r => r.name);
        });

        if (roleType === 'all') {
            let flattened = [];
            Object.keys(userRoles).forEach(key => {
                flattened = [...flattened, userRoles[key]];
            });

            return flattened;
        }

        if (roleType === 'firebot') {
            return userRoles.firebotRoles;
        }
        if (roleType === 'custom') {
            return userRoles.customRoles;
        }
        if (roleType === 'twitch') {
            return userRoles.twitchRoles;
        }
        if (roleType === 'team') {
            return userRoles.teamRoles;
        }
        return [];
    }
};