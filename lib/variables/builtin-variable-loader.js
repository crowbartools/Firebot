"use strict";

const replaceVariableManager = require("./replace-variable-manager");

exports.loadReplaceVariables = () => {
    // get variable definitions
    const user = require("./builtin/user");
    const subMonths = require("./builtin/subMonths");
    const arg = require("./builtin/args");

    // register them
    replaceVariableManager.registerReplaceVariable(user);
    replaceVariableManager.registerReplaceVariable(subMonths);
    replaceVariableManager.registerReplaceVariable(arg);
};
