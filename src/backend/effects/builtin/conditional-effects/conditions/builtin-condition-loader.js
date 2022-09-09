"use strict";

const conditionManager = require("./condition-manager");


exports.registerConditionTypes = () => {
    const username = require("./builtin/username");
    const custom = require("./builtin/custom");
    const viewerRoles = require("./builtin/viewer-roles");
    const argsCount = require("./builtin/args-count");
    const followCheck = require("./builtin/follow-check");

    conditionManager.registerConditionType(username);
    conditionManager.registerConditionType(custom);
    conditionManager.registerConditionType(viewerRoles);
    conditionManager.registerConditionType(argsCount);
    conditionManager.registerConditionType(followCheck);
};