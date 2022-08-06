// Migration: info needed

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "userExists",
        usage: "userExists[username]",
        description: "Outputs 'true' if a user exists in Firebot's database, 'false' if not",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, username) => {
        const userDb = require("../../database/userDatabase");
        const user = await userDb.getTwitchUserByUsername(username);
        return user != null;
    }
};

module.exports = model;
