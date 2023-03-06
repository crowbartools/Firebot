"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const customRolesManager = require("../../roles/custom-roles-manager");

module.exports = {
    definition: {
        handle: "rawCustomRoleUsers",
        usage: "rawCustomRoleUsers[role]",
        description: "Returns an array of all the users in the specified custom role.",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, role) => {
        if (role == null || role === '') {
            return [];
        }

        const customRole = customRolesManager.getRoleByName(role);

        return customRole?.viewers || [];
    }
};