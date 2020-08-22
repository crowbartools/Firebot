"use strict";

const eventManager = require("./EventManager");

exports.loadEventSources = () => {
    // get event definitions
    const firebotEventSource = require("./builtin/firebotEventSource");
    const twitchEventSource = require("./builtin/twitchEventSource");

    // register them
    eventManager.registerEventSource(firebotEventSource);
    eventManager.registerEventSource(twitchEventSource);
};
