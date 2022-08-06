"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerFollow = (username, userId) => {
    eventManager.triggerEvent("twitch", "follow", {
        username,
        userId
    });
};