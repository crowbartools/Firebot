"use strict";

const restrictionsManager = require("./restriction-manager");

exports.loadRestrictions = function() {
    const permissions = require("./builtin/permissions");

    restrictionsManager.registerRestriction(permissions);
};