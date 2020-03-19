"use strict";

const conditionManager = require("./condition-manager");


exports.registerConditionTypes = () => {
    let username = require("./builtin/username");
    let custom = require("./builtin/custom");
    let viewerRoles = require("./builtin/viewer-roles");
    let argsCount = require("./builtin/args-count");
    let followCheck = require("./builtin/follow-check");

    conditionManager.registerConditionType(username);
    conditionManager.registerConditionType(custom);
    conditionManager.registerConditionType(viewerRoles);
    conditionManager.registerConditionType(argsCount);
    conditionManager.registerConditionType(followCheck);
};