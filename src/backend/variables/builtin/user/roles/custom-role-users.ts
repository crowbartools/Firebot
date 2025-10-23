import type { ReplaceVariable } from "../../../../../types/variables";
import customRolesManager from "../../../../roles/custom-roles-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "customRoleUsers",
        usage: "customRoleUsers[role]",
        description: "Returns an array of all the user display names in the specified custom role.",
        categories: ["user based"],
        possibleDataOutput: ["array"],
        examples: [
            {
                usage: "customRoleUsers[role, username]",
                description: "Returns an array of all the user names (instead of *display names*) in the specified custom role."
            },
            {
                usage: "customRoleUsers[role, raw]",
                description: "Returns an array of user objects (with `displayName`, `id`, and `username` properties) in the specified custom role."
            }
        ]
    },
    evaluator: (_, role: string, propertyName?: string) => {
        if (role == null || role === '') {
            return [];
        }

        const customRole = customRolesManager.getRoleByName(role);

        if (propertyName?.toLowerCase() === "username") {
            return customRole?.viewers?.map(v => v.username) || [];
        } else if (propertyName?.toLowerCase() === "raw") {
            return customRole?.viewers || [];
        }

        return customRole?.viewers?.map(v => v.displayName) || [];
    }
};

export default model;
