import { JsonDB } from "node-json-db";
import logger from "../logwrapper";
import accountAccess from "../common/account-access";
import profileManager from "../common/profile-manager";
import frontendCommunicator from "../common/frontend-communicator";
import twitchApi from "../twitch-api/api";
import { CustomReward } from "../twitch-api/resource/channel-rewards";
import { EffectTrigger } from "../../shared/effect-constants";
import { RewardRedemptionMetadata, SavedChannelReward } from "../../types/channel-rewards";


class ChannelRewardManager {
    channelRewards: Record<string, SavedChannelReward> = {};

    getChannelRewardsDb(): JsonDB {
        return profileManager
            .getJsonDbInProfile("channel-rewards");
    }

    async loadChannelRewards() {
        if (accountAccess.getAccounts().streamer.broadcasterType === "") {
            return;
        }

        logger.debug(`Attempting to load channel rewards...`);

        try {
            // Load existing reward data
            const channelRewardsData: Record<string, SavedChannelReward> = this.getChannelRewardsDb().getData("/") || {};
            const rewards = Object.values(channelRewardsData);

            // Get all manageable rewards from Twitch
            const twitchManageableRewards: CustomReward[] = await twitchApi.channelRewards.getManageableCustomChannelRewards();
            if (twitchManageableRewards == null) {
                logger.error("Manageable Twitch channel rewards returned null!");
                this.channelRewards = channelRewardsData;
                return;
            }

            // Determine new manageable rewards
            const newManageableChannelRewards = twitchManageableRewards
                .filter(nr => rewards.every(r => r.id !== nr.id))
                .map(nr => {
                    return {
                        id: nr.id,
                        manageable: true,
                        twitchData: nr
                    };
                });

            // Get all unmanageable rewards from Twitch
            const twitchUnmanageableRewards = await twitchApi.channelRewards.getUnmanageableCustomChannelRewards();
            if (twitchUnmanageableRewards == null) {
                logger.error("Unmanageable Twitch channel rewards returned null!");
                this.channelRewards = channelRewardsData;
                return;
            }

            // Determine new unmanageable rewards
            const newTwitchUnmanageableRewards: SavedChannelReward[] = twitchUnmanageableRewards
                .filter(ur => rewards.every(r => r.id !== ur.id))
                .map(ur => {
                    return {
                        id: ur.id,
                        manageable: false,
                        twitchData: ur
                    };
                });

            // Sync current reward Twitch data/manageability status, remove deleted rewards, then add new rewards
            const syncedRewards: Record<string, SavedChannelReward> = rewards.map(r => {
                const rewardTwitchData = twitchManageableRewards.find(tc => tc.id === r.id);

                // If we have a match, this is a manageable reward
                if (rewardTwitchData != null) {
                    r.twitchData = rewardTwitchData;
                    r.manageable = true;
                    return r;
                }

                // Otherwise, this is either unmanageable or doesn't exist.
                r.twitchData = twitchUnmanageableRewards.find(tc => tc.id === r.id);
                r.manageable = false;
                return r;
            })
                .filter(r => r.twitchData != null)
                .concat(newManageableChannelRewards)
                .concat(newTwitchUnmanageableRewards)
                .reduce((acc, current) => {
                    acc[current.id] = current;
                    return acc;
                }, {});

            this.getChannelRewardsDb().push("/", syncedRewards);

            this.channelRewards = syncedRewards;

            logger.debug(`Loaded channel rewards.`);
        } catch (err) {
            logger.warn(`There was an error reading channel rewards file.`, err);
        }
    }

    async saveChannelReward(channelReward: SavedChannelReward, emitUpdateEvent = false) {
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

        this.channelRewards[channelReward.id] = channelReward;

        try {
            const channelRewardsDb = this.getChannelRewardsDb();

            channelRewardsDb.push(`/${channelReward.id}`, channelReward);

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

    async saveAllChannelRewards(allChannelRewards: SavedChannelReward[], updateTwitch = false) {
        if (updateTwitch) {
            for (const channelReward of allChannelRewards) {
                await twitchApi.channelRewards.updateCustomChannelReward(channelReward.twitchData);
            }
        }

        const rewardsObject: Record<string, SavedChannelReward> = allChannelRewards.reduce((acc, current) => {
            acc[current.id] = current;
            return acc;
        }, {});

        this.channelRewards = rewardsObject;

        try {
            const channelRewardsDb = this.getChannelRewardsDb();

            channelRewardsDb.push("/", this.channelRewards);

            logger.debug(`Saved all channel rewards to file.`);

        } catch (err) {
            logger.warn(`There was an error saving all channel rewards.`, err);
            return null;
        }
    }

    async deleteChannelReward(channelRewardId) {
        if (channelRewardId == null) {
            return;
        }

        delete this.channelRewards[channelRewardId];

        try {
            const channelRewardsDb = this.getChannelRewardsDb();

            channelRewardsDb.delete(`/${this.channelRewards}`);

            await twitchApi.channelRewards.deleteCustomChannelReward(channelRewardId);

            logger.debug(`Deleted channel reward: ${this.channelRewards}`);

        } catch (err) {
            logger.warn(`There was an error deleting a channel reward.`, err);
        }
    }

    getChannelReward(channelRewardId: string): SavedChannelReward {
        if (channelRewardId == null) {
            return null;
        }
        return this.channelRewards[channelRewardId];
    }

    getChannelRewardIdByName(channelRewardName: string): string {
        if (channelRewardName == null) {
            return null;
        }
        const channelReward = Object.values(this.channelRewards)
            .filter(r => r.twitchData != null)
            .find(r => r.twitchData.title === channelRewardName);

        return channelReward ? channelReward.id : null;
    }

    async triggerChannelReward(rewardId: string, metadata: RewardRedemptionMetadata, manual = false): Promise<any> {
        const savedReward = this.channelRewards[rewardId];
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
            console.log(`error when running effects: ${reason}`);
        }
    }
}

const channelRewardManager = new ChannelRewardManager();

frontendCommunicator.onAsync("getChannelRewardCount",
    twitchApi.channelRewards.getTotalChannelRewardCount);

frontendCommunicator.onAsync("getChannelRewards", async () => Object.values(channelRewardManager.channelRewards));

frontendCommunicator.onAsync("saveChannelReward",
    (channelReward: SavedChannelReward) => channelRewardManager.saveChannelReward(channelReward));

frontendCommunicator.onAsync("saveAllChannelRewards",
    async (data: { channelRewards: SavedChannelReward[]; updateTwitch: boolean}) =>
        await channelRewardManager.saveAllChannelRewards(data.channelRewards, data.updateTwitch));

frontendCommunicator.onAsync("syncChannelRewards", async (): Promise<SavedChannelReward[]> => {
    await channelRewardManager.loadChannelRewards();
    return Object.values(channelRewardManager.channelRewards);
});

frontendCommunicator.onAsync("deleteChannelReward", async (channelRewardId: string) => {
    await channelRewardManager.deleteChannelReward(channelRewardId);
});

frontendCommunicator.on("manuallyTriggerReward", (channelRewardId: string) => {
    const savedReward = channelRewardManager.channelRewards[channelRewardId];

    if (savedReward == null) {
        return;
    }

    const accountAccess = require("../common/account-access");

    channelRewardManager.triggerChannelReward(channelRewardId, {
        messageText: "Testing reward",
        redemptionId: "test-redemption-id",
        rewardId: savedReward.id,
        rewardCost: savedReward.twitchData.cost,
        rewardImage: savedReward.twitchData.image ? savedReward.twitchData.image.url4x : savedReward.twitchData.defaultImage.url4x,
        rewardName: savedReward.twitchData.title,
        username: accountAccess.getAccounts().streamer.displayName
    }, true);
});

export = channelRewardManager;