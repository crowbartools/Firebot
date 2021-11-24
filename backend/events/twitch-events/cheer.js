"use strict";

const eventManager = require("../../events/EventManager");

/** @param {import("@twurple/pubsub").PubSubBitsMessage} cheerInfo */
exports.triggerCheer = (cheerInfo) => {
    eventManager.triggerEvent("twitch", "cheer", {
        username: cheerInfo.userName,
        isAnonymous: cheerInfo.isAnonymous,
        bits: cheerInfo.bits,
        totalBits: cheerInfo.totalBits,
        cheerMessage: cheerInfo.message || ""
    });
};

/** @param {import("@twurple/pubsub").PubSubBitsBadgeUnlockMessage} unlockInfo */
exports.triggerBitsBadgeUnlock = (unlockInfo) => {
    eventManager.triggerEvent("twitch", "bits-badge-unlocked", {
        username: unlockInfo.userName,
        message: unlockInfo.message || "",
        badgeTier: unlockInfo.badgeTier
    });
};