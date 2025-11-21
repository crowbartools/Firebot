import type { ReplaceVariable } from "../../../../../types/variables";
import customRolesManager from "../../../../roles/custom-roles-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "customRoleUserCount",
        description: "Get the number of people in a custom role.",
        usage: "customRoleUserCount[role]",
        categories: ["numbers"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger, roleName: string) => {
        if (roleName == null || roleName == null) {
            return 0;
        }

        const customRole = customRolesManager.getRoleByName(roleName);

        if (customRole !== null) {
            return customRole.viewers.length;
        }

        return 0;
    }
};

export default model;
