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

    const patronageEarned = require("./builtin/patronageEarned");
    const patronageNextMilestoneReward = require("./builtin/patronageNextMilestoneReward");
    const patronageNextMilestoneTarget = require("./builtin/patronageNextMilestoneTarget");
    const patronagePreviousMilestoneReward = require("./builtin/patronagePreviousMilestoneReward");
    const patronagePreviousMilestoneTarget = require("./builtin/patronagePreviousMilestoneTarget");

    const commafy = require("./builtin/commafy");
    const math = require("./builtin/math");
    const randomNumber = require("./builtin/randomNumber");
    const randomViewer = require("./builtin/randomViewer");

    const customVariable = require("./builtin/customVariable");

    const commandTrigger = require("./builtin/commandTrigger");

    const controlText = require("./builtin/controlText");
    const controlProgress = require("./builtin/controlProgress");
    const controlCost = require("./builtin/controlCost");
    const controlCooldown = require("./builtin/controlCooldown");
    const controlTooltip = require("./builtin/controlTooltip");
    const controlActiveState = require("./builtin/controlActiveState");

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

    replaceVariableManager.registerReplaceVariable(patronageEarned);
    replaceVariableManager.registerReplaceVariable(patronageNextMilestoneReward);
    replaceVariableManager.registerReplaceVariable(patronageNextMilestoneTarget);
    replaceVariableManager.registerReplaceVariable(patronagePreviousMilestoneReward);
    replaceVariableManager.registerReplaceVariable(patronagePreviousMilestoneTarget);

    replaceVariableManager.registerReplaceVariable(commafy);
    replaceVariableManager.registerReplaceVariable(math);
    replaceVariableManager.registerReplaceVariable(randomNumber);
    replaceVariableManager.registerReplaceVariable(randomViewer);

    replaceVariableManager.registerReplaceVariable(customVariable);

    replaceVariableManager.registerReplaceVariable(commandTrigger);

    replaceVariableManager.registerReplaceVariable(controlText);
    replaceVariableManager.registerReplaceVariable(controlProgress);
    replaceVariableManager.registerReplaceVariable(controlCost);
    replaceVariableManager.registerReplaceVariable(controlCooldown);
    replaceVariableManager.registerReplaceVariable(controlTooltip);
    replaceVariableManager.registerReplaceVariable(controlActiveState);
};
