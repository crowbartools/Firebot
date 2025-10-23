import type { ReplaceVariable } from "../../../../types/variables";

import usernameArray from './username-array';

const model : ReplaceVariable = {
    definition: {
        handle: "rawUsernameArray",
        description: "(Deprecated: use $usernameArray) Returns a raw array of all usernames saved in the user db",
        categories: ["advanced"],
        possibleDataOutput: ["array"],
        hidden: true
    },
    evaluator: usernameArray.evaluator
};

export default model;