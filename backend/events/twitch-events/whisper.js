"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerWhisper = (username, message) => {
    eventManager.triggerEvent("twitch", "whisper", {
        username,
        message
    });
};