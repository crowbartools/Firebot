"use strict";

const eventManager = require("../../../events/EventManager");

exports.triggerHost = (username, auto, viewerCount = 0) => {
    eventManager.triggerEvent("mixer", "hosted", {
        username: username,
        viewerCount: viewerCount,
        auto: auto
    });
};