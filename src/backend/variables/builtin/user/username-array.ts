import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const userDb = require("../../../database/userDatabase");

const model : ReplaceVariable = {
    definition: {
        handle: "usernameArray",
        description: "Returns an array of all usernames saved in the user db",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {
        const usernames = await userDb.getAllUsernames();
        return usernames;
    }
};

export default model;
