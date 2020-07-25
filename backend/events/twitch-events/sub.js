"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerSub = (username, subPlan, subType, totalMonths = 1, streak = 1, isPrime, resub = false) => {
    eventManager.triggerEvent("twitch", "sub", {
        username,
        subPlan,
        subType,
        totalMonths,
        streak,
        isPrime,
        resub
    });
};