"use strict";

const NodeCache = require("node-cache");

const { settings } = require("../../common/settings-access");
const eventManager = require("../../events/EventManager");

const communitySubCache = new NodeCache({ stdTTL: 2, checkperiod: 2 });

/** @param {import("@twurple/chat").ChatCommunitySubInfo} subInfo */
exports.triggerCommunitySubGift = (subInfo) => {
    const gifterDisplayName = subInfo.gifterDisplayName ? subInfo.gifterDisplayName : "An Anonymous Gifter";

    communitySubCache.set(`${gifterDisplayName}:${subInfo.plan}`, subInfo.count);

    eventManager.triggerEvent("twitch", "community-subs-gifted", {
        username: gifterDisplayName,
        subCount: subInfo.count,
        gifterUsername: gifterDisplayName,
        subPlan: subInfo.plan
    });
};

/** @param {import("@twurple/pubsub").PubSubSubscriptionMessage} subInfo */
exports.triggerSubGift = (subInfo) => {

    if (settings.ignoreSubsequentSubEventsAfterCommunitySub()) {
        const cacheKey = `${subInfo.gifterDisplayName}:${subInfo.subPlan}`;

        const communityCount = communitySubCache.get(cacheKey);
        if (communityCount != null) {
            if (communityCount > 0) {
                const newCount = communityCount - 1;
                if (newCount > 0) {
                    communitySubCache.set(cacheKey, newCount);
                } else {
                    communitySubCache.del(cacheKey);
                }
            }
            return;
        }
    }

    eventManager.triggerEvent("twitch", "subs-gifted", {
        username: subInfo.userDisplayName,
        giftSubMonths: subInfo.cumulativeMonths || 1,
        gifteeUsername: subInfo.userDisplayName,
        gifterUsername: subInfo.gifterDisplayName || subInfo.userDisplayName,
        subPlan: subInfo.subPlan,
        isAnonymous: subInfo.isAnonymous,
        giftDuration: subInfo.giftDuration
    });
};

/** @param {import("@twurple/chat").ChatSubGiftUpgradeInfo} subInfo */
exports.triggerSubGiftUpgrade = (subInfo) => {
    eventManager.triggerEvent("twitch", "gift-sub-upgraded", {
        username: subInfo.displayName,
        gifterUsername: subInfo.gifterDisplayName,
        gifteeUsername: subInfo.displayName,
        subPlan: subInfo.plan
    });
};