// Migration: info needed

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "usernameArray",
        description: "Returns a JSON array of all usernames saved in the user db",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {
        const userDb = require("../../database/userDatabase");
        const usernames = await userDb.getAllUsernames();
        return JSON.stringify(usernames);
    }
};

module.exports = model;
