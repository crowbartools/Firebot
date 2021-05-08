"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerCheer = (username, bits, totalBits, message = "") => {
    eventManager.triggerEvent("twitch", "cheer", {
        username,
        bits,
        totalBits,
        message
    });
};