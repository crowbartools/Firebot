"use strict";

const eventManager = require("../EventManager");

exports.triggerBanned = (username) => {
    eventManager.triggerEvent("twitch", "banned", {
        username
    });
};