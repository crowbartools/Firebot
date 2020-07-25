"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerViewerArrived = (username) => {
    eventManager.triggerEvent("twitch", "viewer-arrived", {
        username
    });
};