"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerCheer = (username, totalBits, message = "") => {
    eventManager.triggerEvent("twitch", "cheer", {
        username,
        totalBits,
        message
    });
};