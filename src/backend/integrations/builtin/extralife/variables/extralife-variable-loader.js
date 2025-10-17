"use strict";

const { ReplaceVariableManager } = require("../../../../variables/replace-variable-manager");

exports.registerVariables = () => {
    const donations = require("../variables/extralife-donations");
    const incentives = require("../variables/extralife-incentives");
    const info = require("../variables/extralife-info");
    const milestones = require("../variables/extralife-milestones");


    ReplaceVariableManager.registerReplaceVariable(donations);
    ReplaceVariableManager.registerReplaceVariable(incentives);
    ReplaceVariableManager.registerReplaceVariable(info);
    ReplaceVariableManager.registerReplaceVariable(milestones);
};
