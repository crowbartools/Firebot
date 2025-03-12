import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import usernameArray from './username-array';

const model : ReplaceVariable = {
    definition: {
        handle: "rawUsernameArray",
        description: "(Deprecated: use $usernameArray) Returns a raw array of all usernames saved in the user db",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ARRAY],
        hidden: true
    },
    evaluator: usernameArray.evaluator
};

export default model;