"use strict";

const accountAccess = require("../../common/account-access");

const model = {
    definition: {
        handle: "bot",
        description: "Outputs the Bot account username."
    },
    evaluator: _ => {
        if (accountAccess.getAccounts().bot.loggedIn) {
            return accountAccess.getAccounts().bot.username;
        }
        return "Unknown Bot";
    }
};

module.exports = model;
