import type { ReplaceVariable } from "../../../../../types/variables";

import customRoleUsers from './custom-role-users';

const model : ReplaceVariable = {
    definition: {
        handle: "rawCustomRoleUsers",
        usage: "rawCustomRoleUsers[role]",
        description: "(Deprecated: use $customRoleUsers) Returns an array of all the users in the specified custom role.",
        categories: ["user based"],
        possibleDataOutput: ["array"],
        hidden: true
    },
    evaluator: customRoleUsers.evaluator
};

export default model;