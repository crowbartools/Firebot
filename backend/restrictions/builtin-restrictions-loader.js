"use strict";

const restrictionsManager = require("./restriction-manager");

exports.loadRestrictions = function() {
    const permissions = require("./builtin/permissions");
    const channelProgression = require("./builtin/channelProgression");
    const channelCurrency = require("./builtin/channelCurrency");

    restrictionsManager.registerRestriction(permissions);
    restrictionsManager.registerRestriction(channelProgression);
    restrictionsManager.registerRestriction(channelCurrency);
};