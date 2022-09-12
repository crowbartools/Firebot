"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerFollow = (userId, userIdName, username) => {
    eventManager.triggerEvent("twitch", "follow", {
        userId,
        userIdName,
        username
    });
};