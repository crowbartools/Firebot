"use strict";

const replaceVariableManager = require("./replace-variable-manager");

exports.loadReplaceVariables = () => {
    // get variable definitions
    const user = require("./builtin/user");

    // register them
    replaceVariableManager.registerReplaceVariable(user);
};
