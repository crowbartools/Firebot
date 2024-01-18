import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "userExists",
        usage: "userExists[username]",
        description: "Outputs 'true' if a user exists in Firebot's database, 'false' if not",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, username) => {
        const userDb = require("../../database/userDatabase");
        const user = await userDb.getTwitchUserByUsername(username);
        return user != null;
    }
};

export default model;
