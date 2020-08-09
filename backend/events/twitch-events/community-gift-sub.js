"use strict";

const eventManager = require("../EventManager");

exports.triggerCommunitySubGift = (gifterUsername, subPlan, subCount) => {
    eventManager.triggerEvent("twitch", "community-subs-gifted", {
        username: gifterUsername,
        subCount,
        gifterUsername,
        subPlan
    });
};