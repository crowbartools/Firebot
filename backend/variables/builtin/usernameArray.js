// Migration: info needed

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "usernameArray",
        description: "Returns a JSON array of all usernames saved in the user db",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {
        const userDb = require("../../database/userDatabase");
        const usernames = await userDb.getAllUsernames();
        return JSON.stringify(usernames);
    }
};

module.exports = model;
