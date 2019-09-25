"use strict";

const restrictionsManager = require("./restriction-manager");

exports.loadRestrictions = function() {
    const permissions = require("./builtin/permissions");
    const channelProgression = require("./builtin/channelProgression");

    restrictionsManager.registerRestriction(permissions);
    restrictionsManager.registerRestriction(channelProgression);
};