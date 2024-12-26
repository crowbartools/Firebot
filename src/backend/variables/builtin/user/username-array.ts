import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import viewerDatabase from "../../../viewers/viewer-database";

const model : ReplaceVariable = {
    definition: {
        handle: "usernameArray",
        description: "Returns an array of all usernames saved in the user db",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ARRAY]
    },
    evaluator: async () => {
        const usernames = await viewerDatabase.getAllUsernames();
        return usernames;
    }
};

export default model;
