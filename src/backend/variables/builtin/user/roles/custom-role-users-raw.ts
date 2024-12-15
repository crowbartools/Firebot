import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

import customRoleUsers from './custom-role-users';

const model : ReplaceVariable = {
    definition: {
        handle: "rawCustomRoleUsers",
        usage: "rawCustomRoleUsers[role]",
        description: "(Deprecated: use $customRoleUsers) Returns an array of all the users in the specified custom role.",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.ARRAY],
        hidden: true
    },
    evaluator: customRoleUsers.evaluator
};

export default model;