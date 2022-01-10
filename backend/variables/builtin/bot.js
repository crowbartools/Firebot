// Migration: done

"use strict";

const accountAccess = require("../../common/account-access");
const { OutputDataType } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "bot",
        description: "Outputs the Bot account username.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: () => {
        if (accountAccess.getAccounts().bot.loggedIn) {
            return accountAccess.getAccounts().bot.username;
        }
        return "Unknown Bot";
    }
};

module.exports = model;
