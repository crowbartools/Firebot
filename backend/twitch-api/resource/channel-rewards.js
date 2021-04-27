"use strict";

const { snakeKeys, camelKeys } = require('js-convert-case');

const logger = require("../../logwrapper");
const twitchApi = require("../client");
const { TwitchAPICallType } = require("twitch/lib");
const accountAccess = require("../../common/account-access");

async function getCustomChannelRewards(onlyManageable = false) {
    const client = twitchApi.getClient();
    let rewards = [];
    try {
        const response = await client.callAPI({
            type: TwitchAPICallType.Helix,
            url: "channel_points/custom_rewards",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId,
                "only_manageable_reward": onlyManageable
            }
        });
        if (response && response.data) {
            rewards = response.data;
        }
    } catch (err) {
        logger.error("Failed to get twitch custom channel rewards", err);
    }
    return rewards.map(r => camelKeys(r, { recursive: true }));
}

async function createCustomChannelReward(reward) {
    const client = twitchApi.getClient();
    try {
        await client.callAPI({
            type: TwitchAPICallType.Helix,
            url: "channel_points/custom_rewards",
            method: "POST",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId
            },
            body: snakeKeys(reward)
        });
        return true;
    } catch (err) {
        logger.error("Failed to create twitch custom channel reward", err);
        return false;
    }
}

async function updateCustomChannelReward(reward) {
    const client = twitchApi.getClient();
    try {
        await client.callAPI({
            type: TwitchAPICallType.Helix,
            url: "channel_points/custom_rewards",
            method: "PATCH",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId,
                "id": reward.id
            },
            body: snakeKeys(reward)
        });
        return true;
    } catch (err) {
        logger.error("Failed to update twitch custom channel reward", err);
        return false;
    }
}

async function deleteCustomChannelReward(rewardId) {
    const client = twitchApi.getClient();
    try {
        await client.callAPI({
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
exports.updateCustomChannelReward = updateCustomChannelReward;
exports.deleteCustomChannelReward = deleteCustomChannelReward;