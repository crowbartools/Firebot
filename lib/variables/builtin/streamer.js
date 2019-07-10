"use strict";

const accountAccess = require("../../common/account-access");

const model = {
    definition: {
        handle: "streamer",
        description: "Outputs the Streamer account username."
    },
    evaluator: () => {
        return accountAccess.getAccounts().streamer.username;
    }
};

module.exports = model;
