"use strict";

const replaceVariableManager = require("./replace-variable-manager");

exports.loadReplaceVariables = () => {
    // get variable definitions
    const user = require("./builtin/user");
    const subMonths = require("./builtin/subMonths");
    const arg = require("./builtin/arg");
    const target = require("./builtin/target");
    const bot = require("./builtin/bot");
    const streamer = require("./builtin/streamer");
    const date = require("./builtin/date");
    const time = require("./builtin/time");
    const time24 = require("./builtin/time24");

    // register them
    replaceVariableManager.registerReplaceVariable(user);
    replaceVariableManager.registerReplaceVariable(subMonths);
    replaceVariableManager.registerReplaceVariable(arg);
    replaceVariableManager.registerReplaceVariable(target);
    replaceVariableManager.registerReplaceVariable(bot);
    replaceVariableManager.registerReplaceVariable(streamer);
    replaceVariableManager.registerReplaceVariable(date);
    replaceVariableManager.registerReplaceVariable(time);
    replaceVariableManager.registerReplaceVariable(time24);
};
