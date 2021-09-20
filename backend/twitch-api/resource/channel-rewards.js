"use strict";

const { snakeKeys, camelKeys } = require('js-convert-case');

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
 * @property {ImageSet?} image - set of images, can be null if none uploaded
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
 * @property {string?} cooldownExpiresAt - Timestamp of the cooldown expiration. Null if the reward isn’t on cooldown.
 */

/**
 * @typedef CreateCustomRewardPayload
 * @property {string} title - title of reward
 * @property {string} prompt - The prompt for the viewer when they are redeeming the reward
 * @property {number} cost - The cost of the reward
 * @property {boolean} isEnabled - Is the reward currently enabled, if false the reward won’t show up to viewers
 * @property {string} backgroundColor - Custom background color for the reward. Format: Hex with # prefix. Example: #00E5CB.
 * @property {boolean} userInputRequired - Does the user need to enter information when redeeming the reward
 * @property {number} maxRedemptionsPerStream
 * @property {number} maxRedemptionsPerUserPerStream
 * @property {number} globalCooldown
 * @property {boolean} [isPaused] - Is the reward currently paused, if true viewers can’t redeem
 * @property {boolean} autoApproved - Should redemptions be set to FULFILLED status immediately when redeemed and skip the request queue instead of the normal UNFULFILLED status.
 */

/**
 * @param {CustomReward} reward
 * @returns {CreateCustomRewardPayload}
 */
const mapCustomRewardToCreateRewardPayload = (reward) => {
    return {
        title: reward.title,
        prompt: reward.prompt,
        cost: reward.cost,
        isEnabled: reward.isEnabled,
        backgroundColor: reward.backgroundColor,
        userInputRequired: reward.isUserInputRequired,
        maxRedemptionsPerStream: reward.maxPerStreamSetting.isEnabled ? reward.maxPerStreamSetting.maxPerStream : null,
        maxRedemptionsPerUserPerStream: reward.maxPerUserPerStreamSetting.isEnabled ? reward.maxPerUserPerStreamSetting.maxPerUserPerStream : null,
        globalCooldown: reward.globalCooldownSetting.isEnabled ? reward.globalCooldownSetting.globalCooldownSeconds : null,
        isPaused: reward.isPaused,
        autoApproved: reward.shouldRedemptionsSkipRequestQueue
    };
};

/**
 * @param {import("@twurple/api").HelixCustomReward} reward
 * @returns {CustomReward}
 */
const mapCustomRewardResponse = (reward) => {
    return {
        broadcasterId: reward.broadcasterId,
        broadcasterLogin: reward.broadcasterLogin,
        broadcasterName: reward.broadcasterName,
        id: reward.id,
        title: reward.title,
        prompt: reward.prompt,
        cost: reward.cost,
        image: {
            url4x: reward.getImageUrl(4),
            url2x: reward.getImageUrl(2),
            url1x: reward.getImageUrl(1)
        },
        isEnabled: reward.isEnabled,
        backgroundColor: reward.backgroundColor,
        isUserInputRequired: reward.userInputRequired,
        maxPerStreamSetting: {
            isEnabled: reward.maxRedemptionsPerStream != null,
            maxPerStream: reward.maxRedemptionsPerStream
        },
        maxPerUserPerStreamSetting: {
            isEnabled: reward.maxRedemptionsPerUserPerStream != null,
            maxPerUserPerStream: reward.maxRedemptionsPerUserPerStream
        },
        globalCooldownSetting: {
            isEnabled: reward.globalCooldown != null,
            globalCooldownSeconds: reward.globalCooldown
        },
        isPaused: reward.isPaused,
        isInStock: reward.isInStock,
        shouldRedemptionsSkipRequestQueue: reward.autoApproved,
        redemptionsRedeemedCurrentStream: reward.redemptionsThisStream,
        cooldownExpiresAt: reward.cooldownExpiresAt
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
        const response = await client.channelPoints.getCustomRewards(accountAccess.getAccounts().streamer.userId, onlyManageable);

        if (response) {
            rewards = response;
        } else {
            return null;
        }
    } catch (err) {
        logger.error("Failed to get twitch custom channel rewards", err);
        return null;
    }

    return rewards.map(r => mapCustomRewardResponse(r));
};

const getUnmanageableCustomChannelRewards = async () => {
    const allRewards = await getCustomChannelRewards();
    const onlyManageable = await getCustomChannelRewards(true);
    if (allRewards == null || onlyManageable == null) return null;
    const onlyUnmanageable = allRewards.filter(r => onlyManageable.every(mr => mr.id !== r.id));
    return onlyUnmanageable;
};

const getTotalChannelRewardCount = async () => {
    const rewards = await getCustomChannelRewards();
    if (rewards == null) return 0;
    return rewards.length;
};

/**
 * @param {CustomReward} reward
 * @returns {Promise.<CustomReward>}
 */
const createCustomChannelReward = async (reward) => {
    const client = twitchApi.getClient();
    const body = mapCustomRewardToCreateRewardPayload(reward);

    try {
        const response = await client.channelPoints.createCustomReward(accountAccess.getAccounts().streamer.userId, body);
        return camelKeys(response, { recursive: true });
    } catch (err) {
        logger.error("Failed to create twitch custom channel reward", err);
        return null;
    }
};

/**
 * @param {CustomReward} reward
 */
const updateCustomChannelReward = async (reward) => {
    const client = twitchApi.getClient();
    const body = mapCustomRewardToCreateRewardPayload(reward);

    try {
        await client.channelPoints.updateCustomReward(accountAccess.getAccounts().streamer.userId, reward.id, body);
        return true;
    } catch (err) {
        logger.error("Failed to update twitch custom channel reward", err);
        return false;
    }
};

/**
 * @param {string} rewardId
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