"use strict";

const NodeCache = require("node-cache");

const { settings } = require("../../common/settings-access");
const eventManager = require("../../events/EventManager");

const communitySubCache = new NodeCache({ stdTTL: 2, checkperiod: 2 });

exports.triggerCommunitySubGift = (gifterUsername, subPlan, subCount) => {
    communitySubCache.set(`${gifterUsername}:${subPlan}`, subCount);

    eventManager.triggerEvent("twitch", "community-subs-gifted", {
        username: gifterUsername,
        subCount,
        gifterUsername,
        subPlan
    });
};

/** @param {import("twitch-pubsub-client").PubSubSubscriptionMessage} subInfo */
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
        giftSubMonths: subInfo._data["cumulative_months"] || 1,
        gifteeUsername: subInfo._data["recipient_display_name"] || subInfo.userDisplayName,
        gifterUsername: subInfo.gifterDisplayName,
        subPlan: subInfo.subPlan,
        isAnonymous: subInfo.isAnonymous,
        giftDuration: subInfo.giftDuration
    });
};