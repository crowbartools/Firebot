// Migration: info needed

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");
const customRolesManager = require("../../roles/custom-roles-manager");

const model = {
    definition: {
        handle: "customRoleUserCount",
        description: "Get the number of people in a custom role.",
        usage: "customRoleUserCount[roleName]",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (_, roleName) => {
        if (roleName == null || roleName == null) {
            return 0;
        }

        let customRole = customRolesManager.getRoleByName(roleName);

        if (customRole !== null) {
            return customRole.viewers.length;
        }

        return 0;
    }
};

module.exports = model;
