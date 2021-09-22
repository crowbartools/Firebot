"use strict";

const eventManager = require("../../events/EventManager");

/**
 *
 * @param {import("@twurple/pubsub").PubSubSubscriptionMessage} subInfo
 */
exports.triggerSub = (subInfo) => {
    const totalMonths = subInfo._data["cumulative_months"] || 1;
    const streak = subInfo.streakMonths || 1;
    const isPrime = subInfo.subPlan === "Prime";

    eventManager.triggerEvent("twitch", "sub", {
        username: subInfo.userDisplayName,
        subPlan: subInfo.subPlan,
        totalMonths: totalMonths || 1,
        subMessage: subInfo.message.message || "",
        streak: streak,
        isPrime: isPrime,
        isResub: subInfo.isResub
    });
};