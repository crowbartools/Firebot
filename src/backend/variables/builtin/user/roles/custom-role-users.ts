import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const customRolesManager = require("../../../../roles/custom-roles-manager");

const model : ReplaceVariable = {
    definition: {
        handle: "customRoleUsers",
        usage: "customRoleUsers[role]",
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

export default model;