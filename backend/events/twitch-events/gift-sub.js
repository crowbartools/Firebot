"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerSubGift = (gifterUsername, gifteeUsername, giftCount, subPlan, subType) => {
    eventManager.triggerEvent("twitch", "subs-gifted", {
        username: gifteeUsername,
        gifteeUsername,
        gifterUsername,
        giftCount,
        subPlan,
        subType
    });
};