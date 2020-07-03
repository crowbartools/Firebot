"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerSub = (username, subType, totalMonths = 1, streak = 1, isPrime) => {
    eventManager.triggerEvent("twitch", "sub", {
        username,
        subType,
        totalMonths,
        streak,
        isPrime
    });
};