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

exports.triggerSub = (subInfo) => {
    const subType = getSubType(subInfo.subPlan);

    eventManager.triggerEvent("twitch", "sub", {
        username: subInfo.userDisplayName,
        subPlan: subInfo.subPlan,
        subType: subType,
        totalMonths: subInfo.months,
        streak: subInfo.streakMonths,
        isPrime: subInfo.subPlan === "Prime",
        resub: subInfo.isResub
    });
};