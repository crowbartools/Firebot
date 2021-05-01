"use strict";

const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");
const twitchApi = require("../twitch-api/api");


/**
 * @typedef SavedChannelReward
 * @property {string} id - the id of the preset effect list
 * @property {import('../twitch-api/resource/channel-rewards').CustomReward} twitchData - twitch data for channel reward
 * @property {object} effects - the saved effects in the list
 * @property {string} effects.id - the effect list root id
 * @property {any[]} effects.list - the array of effects objects
 */

/**
 * @type {Object.<string, SavedChannelReward>}
 */
let channelRewards = {};

function getChannelRewardsDb() {
    return profileManager
        .getJsonDbInProfile("channel-rewards");
}

async function loadChannelRewards() {
    logger.debug(`Attempting to load channel rewards...`);

    try {
        const channelRewardsData = getChannelRewardsDb().getData("/") || {};

        /**{@type } */
        const rewards = Object.values(channelRewardsData);

        const twitchChannelRewards = await twitchApi.channelRewards.getCustomChannelRewards(true);


        logger.debug(`Loaded channel rewards.`);
    } catch (err) {
        logger.warn(`There was an error reading channel rewards file.`, err);
    }
}