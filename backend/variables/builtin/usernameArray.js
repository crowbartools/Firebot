// Migration: info needed

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "usernameArray",
        description: "Returns a JSON array of all usernames saved in the user db",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {
        const userDb = require("../../database/userDatabase");
        const usernames = await userDb.getAllUsernames();
        return JSON.stringify(usernames);
    }
};

module.exports = model;
