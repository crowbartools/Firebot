"use strict";

const NodeCache = require("node-cache");

const { settings } = require("../../common/settings-access");
const eventManager = require("../../events/EventManager");

const communitySubCache = new NodeCache({ stdTTL: 2, checkperiod: 2 });

/** @param {import("@twurple/chat").ChatCommunitySubInfo} subInfo */
exports.triggerCommunitySubGift = (subInfo) => {
    const gifterDisplayName = subInfo.gifterDisplayName ? subInfo.gifterDisplayName : "An Anonymous Gifter";

    communitySubCache.set(`${gifterDisplayName}:${subInfo.plan}`, {subCount: subInfo.count, giftReceivers: []});
};

/** @param {import("@twurple/pubsub").PubSubSubscriptionMessage} subInfo */
exports.triggerSubGift = (subInfo) => {
    if (settings.ignoreSubsequentSubEventsAfterCommunitySub()) {
        const cacheKey = `${subInfo.gifterDisplayName}:${subInfo.subPlan}`;
        const cache = communitySubCache.get(cacheKey);

        if (cacheKey != null) {
            const communityCount = cache.subCount;
            const giftReceivers = cache.giftReceivers;
            if (communityCount != null) {
                if (communityCount > 0) {
                    const newCount = communityCount - 1;
                    giftReceivers.push({ gifteeUsername: subInfo.userDisplayName, giftSubMonths: subInfo.cumulativeMonths || 1});

                    if (newCount > 0) {
                        communitySubCache.set(cacheKey, {subCount: newCount, giftReceivers: giftReceivers});
                    } else {
                        eventManager.triggerEvent("twitch", "community-subs-gifted", {
                            username: subInfo.gifterDisplayName,
                            subCount: giftReceivers.length,
                            subPlan: subInfo.subPlan,
                            isAnonymous: subInfo.isAnonymous,
                            gifterUsername: subInfo.gifterDisplayName,
                            giftReceivers: giftReceivers
                        });

                        communitySubCache.del(cacheKey);
                    }
                }
            }
        }
    } else {
        eventManager.triggerEvent("twitch", "subs-gifted", {
            username: subInfo.userDisplayName,
            giftSubMonths: subInfo.cumulativeMonths || 1,
            gifteeUsername: subInfo.userDisplayName,
            gifterUsername: subInfo.gifterDisplayName || subInfo.userDisplayName,
            subPlan: subInfo.subPlan,
            isAnonymous: subInfo.isAnonymous,
            giftDuration: subInfo.giftDuration
        });
    }
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