"use strict";

const eventManager = require("./EventManager");

exports.loadEventSources = () => {
    // get event definitions
    const firebotEventSource = require("./builtin/firebot-event-source");
    const { TwitchEventSource } = require("../streaming-platforms/twitch/events");

    // register them
    eventManager.registerEventSource(firebotEventSource);
    eventManager.registerEventSource(TwitchEventSource);
};
