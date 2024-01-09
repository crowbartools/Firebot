"use strict";

const variableManager = require("../../../../variables/replace-variable-manager");

exports.registerVariables = () => {
    const donations = require("../variables/extralife-donations");
    const incentives = require("../variables/extralife-incentives");
    const info = require("../variables/extralife-info");
    const milestones = require("../variables/extralife-milestones");


    variableManager.registerReplaceVariable(donations);
    variableManager.registerReplaceVariable(incentives);
    variableManager.registerReplaceVariable(info);
    variableManager.registerReplaceVariable(milestones);
};


