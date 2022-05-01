"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const customRolesManager = require("../../roles/custom-roles-manager");
const util = require("../../utility");

module.exports = {
    definition: {
        handle: "randomCustomRoleUser",
        usage: "randomCustomRoleUser[role]",
        description: "Returns a random user that has the specified custom role.",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, role) => {
        if (role == null || role === '') {
            return "[No custom role specified]";
        }

        const customRole = customRolesManager.getRoleByName(role);

        if (customRole == null) {
            return `[Custom role ${role} does not exist]`;
        }

        if (customRole.viewers.length === 0) {
            return "";
        }

        const randIndex = util.getRandomInt(0, customRole.viewers.length - 1);

        return customRole.viewers[randIndex];
    }
};