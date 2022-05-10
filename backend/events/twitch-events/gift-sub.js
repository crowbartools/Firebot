"use strict";

const NodeCache = require("node-cache");

const { settings } = require("../../common/settings-access");
const eventManager = require("../../events/EventManager");
const logger = require("../../logwrapper");
const moment = require("moment");

const communitySubCache = new NodeCache({ stdTTL: 10, checkperiod: 2 });

/** @param {import("@twurple/chat").ChatCommunitySubInfo} subInfo */
exports.triggerCommunitySubGift = (subInfo) => {
    const gifterDisplayName = subInfo.gifterDisplayName ? subInfo.gifterDisplayName : "An Anonymous Gifter";
    logger.debug(`Received ${subInfo.count} community gift subs from ${gifterDisplayName} at ${moment().format("HH:mm:ss:SS")}`);

    communitySubCache.set(`${gifterDisplayName}:${subInfo.plan}`, {subCount: subInfo.count, giftReceivers: []});
};

/** @param {import("@twurple/chat").ChatSubGiftInfo} subInfo */
exports.triggerSubGift = (subInfo) => {
    if (settings.ignoreSubsequentSubEventsAfterCommunitySub()) {
        logger.debug(`Attempting to process community gift sub from ${subInfo.gifterDisplayName} at ${moment().format("HH:mm:ss:SS")}`);
        const cacheKey = `${subInfo.gifterDisplayName}:${subInfo.plan}`;

        const cache = communitySubCache.get(cacheKey);
        if (cache != null) {
            const communityCount = cache.subCount;
            const giftReceivers = cache.giftReceivers;

            if (communityCount != null) {
                if (communityCount > 0) {
                    const newCount = communityCount - 1;
                    giftReceivers.push({ gifteeUsername: subInfo.displayName, giftSubMonths: subInfo.streak || 1});

                    if (newCount > 0) {
                        communitySubCache.set(cacheKey, {subCount: newCount, giftReceivers: giftReceivers});
                    } else {
                        eventManager.triggerEvent("twitch", "community-subs-gifted", {
                            username: subInfo.gifterDisplayName,
                            subCount: giftReceivers.length,
                            subPlan: subInfo.planName,
                            isAnonymous: !!subInfo.gifterUserId,
                            gifterUsername: subInfo.gifterDisplayName,
                            giftReceivers: giftReceivers
                        });

                        logger.debug(`Community gift sub event triggered, deleting cache`);
                        communitySubCache.del(cacheKey);
                    }

                    return;
                }
            } else {
                logger.debug(`No community gift sub count found in cache`, cache);
            }
        } else {
            logger.debug(`No community gift sub data found in cache`);
        }
    }

    eventManager.triggerEvent("twitch", "subs-gifted", {
        username: subInfo.gifterDisplayName || subInfo.gifter || "Anonymous",
        giftSubMonths: subInfo.months || 1,
        gifteeUsername: subInfo.displayName,
        gifterUsername: subInfo.gifterDisplayName || subInfo.gifter,
        subPlan: subInfo.planName,
        isAnonymous: !subInfo.gifterUserId,
        giftDuration: subInfo.giftDuration
    });
    logger.debug(`Gift Sub event triggered`);
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