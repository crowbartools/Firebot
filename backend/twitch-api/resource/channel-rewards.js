"use strict";

const { snakeKeys, camelKeys } = require('js-convert-case');

const logger = require("../../logwrapper");
const twitchApi = require("../client");
const { TwitchAPICallType } = require("twitch/lib");
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
 * @property {boolean} isUserInputRequired - Does the user need to enter information when redeeming the reward
 * @property {boolean} isMaxPerStreamEnabled
 * @property {number} maxPerStream
 * @property {boolean} isMaxPerUserPerStreamEnabled
 * @property {number} maxPerUserPerStream
 * @property {boolean} isGlobalCooldownEnabled
 * @property {number} globalCooldownSeconds
 * @property {boolean} [isPaused] - Is the reward currently paused, if true viewers can’t redeem
 * @property {boolean} shouldRedemptionsSkipRequestQueue - Should redemptions be set to FULFILLED status immediately when redeemed and skip the request queue instead of the normal UNFULFILLED status.
 */

/**
 * @param {CustomReward} reward
 * @returns {CreateCustomRewardPayload}
 */
function mapCustomRewardToCreateRewardPayload(reward) {
    return {
        title: reward.title,
        prompt: reward.prompt,
        cost: reward.cost,
        isEnabled: reward.isEnabled,
        backgroundColor: reward.backgroundColor,
        isUserInputRequired: reward.isUserInputRequired,
        isMaxPerStreamEnabled: reward.maxPerStreamSetting.isEnabled,
        maxPerStream: reward.maxPerStreamSetting.maxPerStream || 0,
        isMaxPerUserPerStreamEnabled: reward.maxPerUserPerStreamSetting.isEnabled,
        maxPerUserPerStream: reward.maxPerUserPerStreamSetting.maxPerUserPerStream || 0,
        isGlobalCooldownEnabled: reward.globalCooldownSetting.isEnabled,
        globalCooldownSeconds: reward.globalCooldownSetting.globalCooldownSeconds || 0,
        isPaused: reward.isPaused,
        shouldRedemptionsSkipRequestQueue: reward.shouldRedemptionsSkipRequestQueue
    };
}


/**
 * Get an array of custom rewards
 * @param {boolean} onlyManageable - only get rewards manageable by firebot
 * @returns {Promise.<CustomReward[]>}
 */

async function getCustomChannelRewards(onlyManageable = false) {
    const client = twitchApi.getClient();
    let rewards = [];
    try {
        const response = await client.callApi({
            type: TwitchAPICallType.Helix,
            url: "channel_points/custom_rewards",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId,
                "only_manageable_rewards": onlyManageable
            }
        });
        if (response && response.data) {
            rewards = response.data;
        } else {
            return null;
        }
    } catch (err) {
        logger.error("Failed to get twitch custom channel rewards", err.message);
        return null;
    }
    return rewards.map(r => camelKeys(r, { recursive: true }));
}

async function getUnmanageableCustomChannelRewards() {
    const allRewards = await getCustomChannelRewards();
    const onlyManageable = await getCustomChannelRewards(true);
    if (allRewards == null || onlyManageable == null) return null;
    const onlyUnmanageable = allRewards.filter(r => onlyManageable.every(mr => mr.id !== r.id));
    return onlyUnmanageable;
}

async function getTotalChannelRewardCount() {
    const rewards = await getCustomChannelRewards();
    if (rewards == null) return 0;
    return rewards.length;
}

/**
 * @param {CustomReward} reward
 * @returns {Promise.<CustomReward>}
 */
async function createCustomChannelReward(reward) {

    const body = snakeKeys(mapCustomRewardToCreateRewardPayload(reward));

    const client = twitchApi.getClient();
    try {
        const response = await client.callApi({
            type: TwitchAPICallType.Helix,
            url: "channel_points/custom_rewards",
            method: "POST",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId
            },
            body: body
        });
        return camelKeys(response.data[0], { recursive: true });
    } catch (err) {
        logger.error("Failed to create twitch custom channel reward", err);
        return null;
    }
}

/**
 * @param {CustomReward} reward
 */
async function updateCustomChannelReward(reward) {
    const client = twitchApi.getClient();
    try {
        await client.callApi({
            type: TwitchAPICallType.Helix,
            url: "channel_points/custom_rewards",
            method: "PATCH",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId,
                "id": reward.id
            },
            body: snakeKeys(mapCustomRewardToCreateRewardPayload(reward))
        });
        return true;
    } catch (err) {
        logger.error("Failed to update twitch custom channel reward", err);
        return false;
    }
}

/**
 * @param {string} rewardId
 */
async function deleteCustomChannelReward(rewardId) {
    const client = twitchApi.getClient();
    try {
        await client.callApi({
            type: TwitchAPICallType.Helix,
            url: "channel_points/custom_rewards",
            method: "DELETE",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId,
                "id": rewardId
            }
        });
        return true;
    } catch (err) {
        logger.error("Failed to update twitch custom channel reward", err);
        return false;
    }
}

exports.createCustomChannelReward = createCustomChannelReward;
exports.getCustomChannelRewards = getCustomChannelRewards;
exports.getUnmanageableCustomChannelRewards = getUnmanageableCustomChannelRewards;
exports.updateCustomChannelReward = updateCustomChannelReward;
exports.deleteCustomChannelReward = deleteCustomChannelReward;
exports.getTotalChannelRewardCount = getTotalChannelRewardCount;