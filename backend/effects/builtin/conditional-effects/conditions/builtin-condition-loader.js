"use strict";

const conditionManager = require("./condition-manager");


exports.registerConditionTypes = () => {
    let username = require("./builtin/username");
    let custom = require("./builtin/custom");

    conditionManager.registerConditionType(username);
    conditionManager.registerConditionType(custom);
};