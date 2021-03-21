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

exports.triggerSubGift = (gifterUsername, gifteeUsername, subPlan, subType, months) => {

    if (settings.ignoreSubsequentSubEventsAfterCommunitySub) {
        const cacheKey = `${gifterUsername}:${subPlan}`;

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
        username: gifteeUsername,
        giftSubMonths: months,
        gifteeUsername,
        gifterUsername,
        subPlan,
        subType
    });
};