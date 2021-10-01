"use strict";

const restrictionsManager = require("./restriction-manager");

exports.loadRestrictions = function() {
    const permissions = require("./builtin/permissions");
    const channelProgression = require("./builtin/channelProgression");
    const channelCurrency = require("./builtin/channelCurrency");
    const activeChatUsers = require("./builtin/activeChatUsers");
    const customVariable = require('./builtin/customVariable');
    const viewTime = require('./builtin/viewTimeRestriction');
    const mixplayInteractions = require('./builtin/mixplayInteractions');
    const chatMessages = require('./builtin/chatMessages');
    const followCheck = require('./builtin/followCheck');
    const channelAudience = require('./builtin/channel-audience');
    const channelViewers = require('./builtin/channelViewers');
    const channelGame = require('./builtin/channelGame');

    restrictionsManager.registerRestriction(permissions);
    restrictionsManager.registerRestriction(channelProgression);
    restrictionsManager.registerRestriction(channelCurrency);
    restrictionsManager.registerRestriction(activeChatUsers);
    restrictionsManager.registerRestriction(customVariable);
    restrictionsManager.registerRestriction(viewTime);
    restrictionsManager.registerRestriction(mixplayInteractions);
    restrictionsManager.registerRestriction(chatMessages);
    restrictionsManager.registerRestriction(followCheck);
    restrictionsManager.registerRestriction(channelAudience);
    restrictionsManager.registerRestriction(channelViewers);
    restrictionsManager.registerRestriction(channelGame);
};