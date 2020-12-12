"use strict";

const logger = require("../../logwrapper");
const twitchApi = require("../client");
const { TwitchAPICallType } = require("twitch/lib");
const accountAccess = require("../../common/account-access");

async function getCustomChannelRewards() {
    const client = twitchApi.getClient();
    let rewards = [];
    try {
        const response = await client.callAPI({
            type: TwitchAPICallType.Helix,
            url: "channel_points/custom_rewards",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId
            }
        });
        if (response && response.data) {
            rewards = response.data;
        }
    } catch (err) {
        logger.error("Failed to get twitch custom channel rewards", err);
    }
    return rewards;
}

exports.getCustomChannelRewards = getCustomChannelRewards;