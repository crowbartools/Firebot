"use strict";

const logger = require("../../logwrapper");
const twitchApi = require("../api");
const accountAccess = require("../../common/account-access");

/**
 * @typedef ImageSet
 * @property {string} url1x
 * @property {string} url2x
 * @property {string} url4x
 */

/**
 * @typedef CustomReward
 * @property {string} broadcasterId - broadcaster id
 * @property {string} broadcasterLogin - broadcaster login
 * @property {string} broadcasterName - broadcaster display name
 * @property {string} id - id of the award
 * @property {string} title - title of reward
 * @property {string} prompt - The prompt for the viewer when they are redeeming the reward
 * @property {number} cost - The cost of the reward
 * @property {ImageSet?} [image] - set of images, can be null if none uploaded
 * @property {ImageSet} defaultImage - set of default images
 * @property {string} backgroundColor - Custom background color for the reward. Format: Hex with # prefix. Example: #00E5CB.
 * @property {boolean} isEnabled - Is the reward currently enabled, if false the reward won’t show up to viewers
 * @property {boolean} isUserInputRequired - Does the user need to enter information when redeeming the reward
 * @property {object} maxPerStreamSetting
 * @property {boolean} maxPerStreamSetting.isEnabled
 * @property {number} maxPerStreamSetting.maxPerStream
 * @property {object} maxPerUserPerStreamSetting
 * @property {boolean} maxPerUserPerStreamSetting.isEnabled
 * @property {number} maxPerUserPerStreamSetting.maxPerUserPerStream
 * @property {object} globalCooldownSetting
 * @property {boolean} globalCooldownSetting.isEnabled
 * @property {number} globalCooldownSetting.globalCooldownSeconds
 * @property {boolean} isPaused - is the reward currently paused, if true viewers cant redeem
 * @property {boolean} isInStock - Is the reward currently in stock, if false viewers can’t redeem
 * @property {boolean} shouldRedemptionsSkipRequestQueue - Should redemptions be set to FULFILLED status immediately when redeemed and skip the request queue instead of the normal UNFULFILLED status.
 * @property {number} redemptionsRedeemedCurrentStream - The number of redemptions redeemed during the current live stream. Counts against the max_per_stream_setting limit. Null if the broadcasters stream isn’t live or max_per_stream_setting isn’t enabled.
 * @property {string?} [cooldownExpiresAt] - Timestamp of the cooldown expiration. Null if the reward isn’t on cooldown.
 */

/**
 * @param {CustomReward} reward
 * @returns {import("@twurple/api").HelixCreateCustomRewardData}
 */
const mapCustomRewardToCreateRewardPayload = (reward) => {
    let maxRedemptionsPerStream = null, maxRedemptionsPerUserPerStream = null, globalCooldown = null;

    if (reward.maxPerStreamSetting?.isEnabled === true && reward.maxPerStreamSetting?.maxPerStream > 0) {
        maxRedemptionsPerStream = reward.maxPerStreamSetting.maxPerStream;
    }

    if (reward.maxPerUserPerStreamSetting?.isEnabled === true && reward.maxPerUserPerStreamSetting?.maxPerUserPerStream > 0) {
        maxRedemptionsPerUserPerStream = reward.maxPerUserPerStreamSetting.maxPerUserPerStream;
    }

    if (reward.globalCooldownSetting?.isEnabled === true && reward.globalCooldownSetting?.globalCooldownSeconds > 0) {
        globalCooldown = reward.globalCooldownSetting.globalCooldownSeconds;
    }

    return {
        title: reward.title,
        prompt: reward.prompt,
        cost: reward.cost,
        isEnabled: reward.isEnabled,
        backgroundColor: reward.backgroundColor,
        userInputRequired: reward.isUserInputRequired,
        maxRedemptionsPerStream: maxRedemptionsPerStream,
        maxRedemptionsPerUserPerStream: maxRedemptionsPerUserPerStream,
        globalCooldown: globalCooldown,
        isPaused: reward.isPaused,
        autoFulfill: reward.shouldRedemptionsSkipRequestQueue
    };
};

/**
 * @param {import("@twurple/api").HelixCustomReward} reward
 * @returns {CustomReward}
 */
const mapCustomRewardResponse = (reward) => {
    const image = {
        url1x: reward.getImageUrl(1),
        url2x: reward.getImageUrl(2),
        url4x: reward.getImageUrl(4)
    };

    return {
        broadcasterId: reward.broadcasterId,
        broadcasterLogin: reward.broadcasterLogin,
        broadcasterName: reward.broadcasterName,
        id: reward.id,
        title: reward.title,
        prompt: reward.prompt,
        cost: reward.cost,
        image: image,
        defaultImage: image,
        backgroundColor: reward.backgroundColor,
        isEnabled: reward.isEnabled,
        isUserInputRequired: reward.userInputRequired,
        maxPerStreamSetting: {
            isEnabled: reward.maxRedemptionsPerStream !== null,
            maxPerStream: reward.maxRedemptionsPerStream
        },
        maxPerUserPerStreamSetting: {
            isEnabled: reward.maxRedemptionsPerUserPerStream !== null,
            maxPerUserPerStream: reward.maxRedemptionsPerUserPerStream
        },
        globalCooldownSetting: {
            isEnabled: reward.globalCooldown !== null,
            globalCooldownSeconds: reward.globalCooldown
        },
        isPaused: reward.isPaused,
        isInStock: reward.isInStock,
        shouldRedemptionsSkipRequestQueue: reward.autoApproved,
        cooldownExpiresAt: reward.cooldownExpiryDate
    };
};


/**
 * Get an array of custom rewards
 * @param {boolean} onlyManageable - only get rewards manageable by firebot
 * @returns {Promise.<CustomReward[]>}
 */

const getCustomChannelRewards = async (onlyManageable = false) => {
    const client = twitchApi.getClient();
    let rewards = [];
    try {
        const response = await client.channelPoints.getCustomRewards(
            accountAccess.getAccounts().streamer.userId,
            onlyManageable
        );
        if (response) {
            rewards = response;
        } else {
            return null;
        }
    } catch (err) {
        logger.error("Failed to get twitch custom channel rewards", err.message);
        return null;
    }
    return rewards.map(r => mapCustomRewardResponse(r));
};

/**
 * @returns {Promise<CustomReward[]>}
 */
const getUnmanageableCustomChannelRewards = async () => {
    const allRewards = await getCustomChannelRewards();
    const onlyManageable = await getCustomChannelRewards(true);
    if (allRewards == null || onlyManageable == null) {
        return null;
    }
    const onlyUnmanageable = allRewards.filter(r => onlyManageable.every(mr => mr.id !== r.id));
    return onlyUnmanageable;
};

/**
 * @returns {number}
 */
const getTotalChannelRewardCount = async () => {
    const rewards = await getCustomChannelRewards();
    if (rewards == null) {
        return 0;
    }
    return rewards.length;
};

/**
 * @param {CustomReward} reward
 * @returns {Promise.<CustomReward>}
 */
const createCustomChannelReward = async (reward) => {
    const data = mapCustomRewardToCreateRewardPayload(reward);
    const client = twitchApi.getClient();

    try {
        const response = await client.channelPoints.createCustomReward(
            accountAccess.getAccounts().streamer.userId,
            data
        );

        return mapCustomRewardResponse(response);
    } catch (err) {
        logger.error("Failed to create twitch custom channel reward", err);
        return null;
    }
};

/**
 * @param {CustomReward} reward
 * @returns {Promise<boolean>}
 */
const updateCustomChannelReward = async (reward) => {
    const client = twitchApi.getClient();
    try {
        await client.channelPoints.updateCustomReward(
            accountAccess.getAccounts().streamer.userId,
            reward.id,
            mapCustomRewardToCreateRewardPayload(reward)
        );
        return true;
    } catch (err) {
        logger.error("Failed to update twitch custom channel reward", err);
        return false;
    }
};

/**
 * @param {string} rewardId
 * @returns {Promise<boolean>}
 */
const deleteCustomChannelReward = async (rewardId) => {
    const client = twitchApi.getClient();
    try {
        await client.channelPoints.deleteCustomReward(accountAccess.getAccounts().streamer.userId, rewardId);
        return true;
    } catch (err) {
        logger.error("Failed to update twitch custom channel reward", err);
        return false;
    }
};

exports.createCustomChannelReward = createCustomChannelReward;
exports.getCustomChannelRewards = getCustomChannelRewards;
exports.getUnmanageableCustomChannelRewards = getUnmanageableCustomChannelRewards;
exports.updateCustomChannelReward = updateCustomChannelReward;
exports.deleteCustomChannelReward = deleteCustomChannelReward;
exports.getTotalChannelRewardCount = getTotalChannelRewardCount;