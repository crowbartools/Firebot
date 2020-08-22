"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerSubGift = (gifterUsername, gifteeUsername, subPlan, subType, months) => {
    eventManager.triggerEvent("twitch", "subs-gifted", {
        username: gifteeUsername,
        giftSubMonths: months,
        gifteeUsername,
        gifterUsername,
        subPlan,
        subType
    });
};