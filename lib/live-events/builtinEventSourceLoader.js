"use strict";

const eventManager = require("./EventManager");

exports.loadEventSources = () => {
    // get event definitions
    const firebotEventSource = require("./builtin/firebotEventSource");
    const mixerEventSource = require("./builtin/mixerEventSource");

    // register them
    eventManager.registerEventSource(firebotEventSource);
    eventManager.registerEventSource(mixerEventSource);
};
