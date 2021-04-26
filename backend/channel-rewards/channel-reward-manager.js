"use strict";

const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");

/**
 * @typedef SavedChannelReward
 * @property {string} id - the id of the preset effect list
 * @property {object} twitchData - twitch data for channel reward
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

function loadChannelRewards() {
    logger.debug(`Attempting to load preset effect lists...`);

    try {
        const channelRewardsData = getChannelRewardsDb().getData("/");

        if (channelRewardsData) {
            channelRewards = channelRewardsData;
        }

        logger.debug(`Loaded preset effect lists.`);
    } catch (err) {
        logger.warn(`There was an error reading preset effect lists file.`, err);
    }
}