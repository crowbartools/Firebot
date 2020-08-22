// Migration: todo - Need implementation details

"use strict";
const util = require("../../utility");
const logger = require("../../logwrapper");
const activeViewerHandler = require('../../roles/role-managers/active-chatters');
const customRoleManager = require('../../roles/custom-roles-manager');

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "randomActiveViewer",
        usage: "randomActiveViewer",
        description: "Get a random active chatter.",
        examples: [
            {
                usage: "randomActiveViewer[roleName]",
                description: "Filter to an active viewer in a specific role."
            }
        ],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, roleName) => {
        logger.debug("Getting random active viewer...");

        let activeViewers = activeViewerHandler.getActiveChatters();

        if (activeViewers == null || activeViewers.length === 0) {
            return "[Unable to get random active user]";
        }

        if (roleName == null) {
            let randIndex = util.getRandomInt(0, activeViewers.length - 1);
            return activeViewers[randIndex].username;
        }

        if (roleName != null) {
            let customRole = customRoleManager.getRoleByName(roleName);
            if (customRole == null) {
                return "[Unable to get random active user]";
            }

            let customRoleUsers = customRole.viewers;
            if (customRoleUsers.length === 0) {
                return "[Unable to get random active user]";
            }

            let roleIntersection = activeViewers.filter(user => customRoleUsers.includes(user.username));
            let randIndex = util.getRandomInt(0, roleIntersection.length - 1);
            return roleIntersection[randIndex].username;
        }

        return "[Unable to get random active user]";
    }
};

module.exports = model;
