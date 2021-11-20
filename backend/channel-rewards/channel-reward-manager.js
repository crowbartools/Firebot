"use strict";

const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");
const frontendCommunicator = require("../common/frontend-communicator");
const twitchApi = require("../twitch-api/api");
const { EffectTrigger } = require("../effects/models/effectModels");

/**
 * @typedef SavedChannelReward
 * @property {string} id - the id of the channel reward
 * @property {import('../twitch-api/resource/channel-rewards').CustomReward} twitchData - twitch data for channel reward
 * @property {boolean} manageable - whether or not this reward is manageable by Firebot
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
        /** @type {Object.<string, SavedChannelReward>} */
        const channelRewardsData = getChannelRewardsDb().getData("/") || {};

        const rewards = Object.values(channelRewardsData);

        const twitchChannelRewards = await twitchApi.channelRewards.getCustomChannelRewards();

        if (twitchChannelRewards == null) {
            logger.error("Manageable twitch channel rewards returned null!");
            channelRewards = channelRewardsData;
            return;
        }

        const newManageableChannelRewards = twitchChannelRewards
            .filter(nr => rewards.every(r => r.id !== nr.id))
            .map(nr => {
                return {
                    id: nr.id,
                    manageable: true,
                    twitchData: nr
                };
            });

        const twitchUnmanageableRewards = await twitchApi.channelRewards.getUnmanageableCustomChannelRewards();

        if (twitchUnmanageableRewards == null) {
            logger.error("Unmanageable twitch channel rewards returned null!");
            channelRewards = channelRewardsData;
            return;
        }

        /** @type {SavedChannelReward[]}*/
        const newTwitchUnmanageableRewards = twitchUnmanageableRewards
            .filter(ur => rewards.every(r => r.id !== ur.id))
            .map(ur => {
                return {
                    id: ur.id,
                    manageable: false,
                    twitchData: ur
                };
            });

        /** @type {Object.<string, SavedChannelReward>}*/
        const syncedRewards = rewards.map(r => {
            r.twitchData = twitchChannelRewards.find(tc => tc.id === r.id);
            return r;
        })
            .filter(r => r.twitchData != null)
            .concat(newManageableChannelRewards)
            .concat(newTwitchUnmanageableRewards)
            .reduce((acc, current) => {
                acc[current.id] = current;
                return acc;
            }, {});

        getChannelRewardsDb().push("/", syncedRewards);

        channelRewards = syncedRewards;

        logger.debug(`Loaded channel rewards.`);
    } catch (err) {
        logger.warn(`There was an error reading channel rewards file.`, err);
    }
}

/**
 * @param {SavedChannelReward} channelReward
 */
async function saveChannelReward(channelReward, emitUpdateEvent = false) {
    if (channelReward == null) {
        return null;
    }

    if (channelReward.id == null) {
        const twitchData = await twitchApi.channelRewards.createCustomChannelReward(channelReward.twitchData);
        if (twitchData == null) {
            return null;
        }
        channelReward.twitchData = twitchData;
        channelReward.id = twitchData.id;
    } else if (channelReward.manageable) {
        await twitchApi.channelRewards.updateCustomChannelReward(channelReward.twitchData);
    }

    channelRewards[channelReward.id] = channelReward;

    try {
        const channelRewardsDb = getChannelRewardsDb();

        channelRewardsDb.push("/" + channelReward.id, channelReward);

        logger.debug(`Saved channel reward ${channelReward.id} to file.`);

        if (emitUpdateEvent) {
            frontendCommunicator.send("channel-reward-updated", channelReward);
        }

        return channelReward;
    } catch (err) {
        logger.warn(`There was an error saving a channel reward.`, err);
        return null;
    }
}

/**
 *
 * @param {SavedChannelReward[]} allChannelRewards
 * @param {boolean} updateTwitch
 */
async function saveAllChannelRewards(allChannelRewards, updateTwitch = false) {
    if (updateTwitch) {
        for (const channelReward of allChannelRewards) {
            await twitchApi.channelRewards.updateCustomChannelReward(channelReward.twitchData);
        }
    }

    /** @type {Record<string,SavedChannelReward>} */
    const rewardsObject = allChannelRewards.reduce((acc, current) => {
        acc[current.id] = current;
        return acc;
    }, {});

    channelRewards = rewardsObject;

    try {
        const channelRewardsDb = getChannelRewardsDb();

        channelRewardsDb.push("/", channelRewards);

        logger.debug(`Saved all channel rewards to file.`);

    } catch (err) {
        logger.warn(`There was an error saving all channel rewards.`, err);
        return null;
    }
}

function deleteChannelReward(channelRewardId) {
    if (channelRewardId == null) {
        return;
    }

    delete channelRewards[channelRewardId];

    try {
        const channelRewardsDb = getChannelRewardsDb();

        channelRewardsDb.delete("/" + channelRewards);

        twitchApi.channelRewards.deleteCustomChannelReward(channelRewardId);

        logger.debug(`Deleted channel reward: ${channelRewards}`);

    } catch (err) {
        logger.warn(`There was an error deleting a channel reward.`, err);
    }
}

function getChannelReward(channelRewardId) {
    if (channelRewardId == null) {
        return null;
    }
    return channelRewards[channelRewardId];
}

/**
 *
 * @typedef RewardRedemptionMetadata
 * @property {string} username
 * @property {string} messageText
 * @property {string} redemptionId
 * @property {string} rewardId
 * @property {string} rewardImage
 * @property {string} rewardName
 * @property {string} rewardCost
 */

/**
 *
 * @param {string} rewardId
 * @param {RewardRedemptionMetadata} metadata
 */
async function triggerChannelReward(rewardId, metadata, manual = false) {
    const savedReward = channelRewards[rewardId];
    if (savedReward == null || savedReward.effects == null || savedReward.effects.list == null) {
        return;
    }

    const effectRunner = require("../common/effect-runner");

    const processEffectsRequest = {
        trigger: {
            type: manual ? EffectTrigger.MANUAL : EffectTrigger.CHANNEL_REWARD,
            metadata: metadata
        },
        effects: savedReward.effects
    };

    try {
        return effectRunner.processEffects(processEffectsRequest);
    } catch (reason) {
        console.log("error when running effects: " + reason);
    }
}

frontendCommunicator.onAsync("getChannelRewardCount",
    twitchApi.channelRewards.getTotalChannelRewardCount);

frontendCommunicator.onAsync("getChannelRewards", async () => Object.values(channelRewards));

frontendCommunicator.onAsync("saveChannelReward",
    (/** @type {SavedChannelReward} */ channelReward) => saveChannelReward(channelReward));

frontendCommunicator.onAsync("saveAllChannelRewards",
    async (/** @type {{ channelRewards: SavedChannelReward[]; updateTwitch: boolean}} */ data) =>
        saveAllChannelRewards(data.channelRewards, data.updateTwitch));

frontendCommunicator.onAsync("syncChannelRewards", async () => {
    await loadChannelRewards();
    return Object.values(channelRewards);
});

frontendCommunicator.on("deleteChannelReward", (/** @type {string} */ channelRewardId) => {
    deleteChannelReward(channelRewardId);
});

frontendCommunicator.on("manuallyTriggerReward", (/** @type {string} */ channelRewardId) => {

    const savedReward = channelRewards[channelRewardId];

    if (savedReward == null) {
        return;
    }

    const accountAccess = require("../common/account-access");

    triggerChannelReward(channelRewardId, {
        messageText: "Testing reward",
        redemptionId: "test-redemption-id",
        rewardId: savedReward.id,
        rewardCost: savedReward.twitchData.cost,
        rewardImage: savedReward.twitchData.image ? savedReward.twitchData.image.url4x : savedReward.twitchData.defaultImage.url4x,
        rewardName: savedReward.twitchData.title,
        username: accountAccess.getAccounts().streamer.displayName
    }, true);
});

exports.loadChannelRewards = loadChannelRewards;
exports.getChannelReward = getChannelReward;
exports.saveChannelReward = saveChannelReward;
exports.triggerChannelReward = triggerChannelReward;