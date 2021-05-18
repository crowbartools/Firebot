"use strict";

const eventManager = require("../../events/EventManager");

function getSubType (subPlan) {
    switch (subPlan) {
    case "Prime":
        return "Prime";
    case "1000":
        return "Tier 1";
    case "2000":
        return "Tier 2";
    case "3000":
        return "Tier 3";
    }
}
/**
 *
 * @param {import("twitch-pubsub-client").PubSubSubscriptionMessage} subInfo
 */
exports.triggerSub = (subInfo) => {
    const subType = getSubType(subInfo.subPlan);
    const totalMonths = subInfo._data["cumulative_months"] || 1;
    const streak = subInfo.streakMonths || 1;
    const isPrime = subInfo.subPlan === "Prime";

    eventManager.triggerEvent("twitch", "sub", {
        username: subInfo.userDisplayName,
        subPlan: subInfo.subPlan,
        subType: subType,
        totalMonths: totalMonths || 1,
        subMessage: subInfo.message.message || "",
        streak: streak,
        isPrime: isPrime,
        isResub: subInfo.isResub
    });
};