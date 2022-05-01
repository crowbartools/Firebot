"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const customRolesManager = require("../../roles/custom-roles-manager");

module.exports = {
    definition: {
        handle: "customRoleUsers",
        usage: "customRoleUsers[role]",
        description: "Returns an array of all the users in the specified custom role.",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, role) => {
        if (role == null || role === '') {
            return JSON.stringify([]);
        }

        const customRole = customRolesManager.getRoleByName(role);

        return JSON.stringify(customRole?.viewers || []);
    }
};