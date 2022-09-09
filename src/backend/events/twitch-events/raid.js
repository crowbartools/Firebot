"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerRaid = (username, viewerCount = 0) => {
    eventManager.triggerEvent("twitch", "raid", {
        username: username,
        viewerCount: viewerCount
    });
};