"use strict";

const eventManager = require("../EventManager");

exports.triggerTimeout = (username, timeoutDuration) => {
    eventManager.triggerEvent("twitch", "timeout", {
        username,
        timeoutDuration
    });
};