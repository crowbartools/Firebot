"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerSubGift = (gifterUsername, gifteeUsername, giftCount, subPlan, subType, months) => {
    eventManager.triggerEvent("twitch", "subs-gifted", {
        username: gifteeUsername,
        giftSubMonths: months,
        gifteeUsername,
        gifterUsername,
        giftCount,
        subPlan,
        subType
    });
};