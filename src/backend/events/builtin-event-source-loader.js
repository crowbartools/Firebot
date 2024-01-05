"use strict";

const eventManager = require("./EventManager");

exports.loadEventSources = () => {
    // get event definitions
    const firebotEventSource = require("./builtin/firebot-event-source");
    const twitchEventSource = require("./builtin/twitch-event-source");

    // register them
    eventManager.registerEventSource(firebotEventSource);
    eventManager.registerEventSource(twitchEventSource);
};
