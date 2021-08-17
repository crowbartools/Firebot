// Migration: todo - Need implementation details

"use strict";
const util = require("../../utility");
const logger = require("../../logwrapper");
const activeUserHandler = require('../../chat/chat-listeners/active-user-handler');
const customRoleManager = require('../../roles/custom-roles-manager');

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "randomActiveViewer",
        usage: "randomActiveViewer",
        description: "Get a random active chatter.",
        examples: [
            {
                usage: "randomActiveViewer[roleName]",
                description: "Filter to an active viewer in a specific role."
            },
            {
                usage: "randomActiveViewer[null, ignoreUser]",
                description: "Get a random active user that is NOT the ignore user"
            }
        ],
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, roleName, ignoreUser) => {
        logger.debug("Getting random active viewer...");

        const activeViewerCount = activeUserHandler.getActiveUserCount();

        if (activeViewerCount === 0) {
            return "[Unable to get random active user]";
        }

        if (ignoreUser != null) {
            const randomViewer = activeUserHandler.getRandomActiveUser(ignoreUser);
            return randomViewer ? randomViewer.username : "[Unable to get random active user]";
        }

        if (roleName != null) {
            const customRole = customRoleManager.getRoleByName(roleName);
            if (customRole == null) {
                return "[Unable to get random active user]";
            }

            const customRoleUsers = customRole.viewers;
            if (customRoleUsers.length === 0) {
                return "[Unable to get random active user, customroles]";
            }

            const usersWithRole = activeUserHandler.getAllActiveUsers().filter(user => customRoleUsers.includes(user.username));
            if (usersWithRole.length === 0) {
                return "[Unable to get random active users]";
            }
            const randIndex = util.getRandomInt(0, usersWithRole.length - 1);
            return usersWithRole[randIndex].username;
        }

        if (activeViewerCount > 0) {
            const randomViewer = activeUserHandler.getRandomActiveUser();
            return randomViewer ? randomViewer.username : "[Unable to get random active user]";
        }

        return "[Unable to get random active user]";
    }
};

module.exports = model;
