import { JsonDB } from "node-json-db";

import { RewardRedemptionMetadata, SavedChannelReward } from "../../types/channel-rewards";
import { EffectList } from "../../types/effects";
import { Trigger } from "../../types/triggers";
import { CustomReward, RewardRedemption, RewardRedemptionsApprovalRequest } from "../streaming-platforms/twitch/api/resource/channel-rewards";

import { AccountAccess } from "../common/account-access";
import { ActiveUserHandler } from "../chat/active-user-handler";
import { ProfileManager } from "../common/profile-manager";
import { RestrictionsManager } from "../restrictions/restriction-manager";
import { TwitchApi } from "../streaming-platforms/twitch/api";
import effectRunner from "../common/effect-runner";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

class ChannelRewardManager {
    channelRewards: Record<string, SavedChannelReward> = {};
    private _channelRewardRedemptions: Record<string, RewardRedemption[]> = {};
    private _eligible = false;

    constructor() {
        frontendCommunicator.onAsync("get-channel-reward-count",
            TwitchApi.channelRewards.getTotalChannelRewardCount);

        frontendCommunicator.on("get-channel-rewards", () => Object.values(this.channelRewards));

        frontendCommunicator.on("get-channel-rewards-eligibility", () => this._eligible);

        frontendCommunicator.onAsync("save-channel-reward",
            async (channelReward: SavedChannelReward) => this.saveChannelReward(channelReward));

        frontendCommunicator.onAsync("save-all-channel-rewards",
            async (data: { channelRewards: SavedChannelReward[], updateTwitch: boolean }) =>
                await this.saveAllChannelRewards(data.channelRewards, data.updateTwitch));

        frontendCommunicator.onAsync("sync-channel-rewards", async (): Promise<SavedChannelReward[]> => {
            await this.loadChannelRewards();
            return Object.values(this.channelRewards);
        });

        frontendCommunicator.onAsync("delete-channel-reward", async (channelRewardId: string) => {
            await this.deleteChannelReward(channelRewardId);
        });

        frontendCommunicator.on("manually-trigger-reward", (channelRewardId: string) => {
            const savedReward = this.channelRewards[channelRewardId];

            if (savedReward == null) {
                return;
            }

            // Manually triggered by streamer, must pass in userId and userDisplayName can be falsy
            void this.triggerChannelReward(channelRewardId, {
                messageText: "Testing reward",
                redemptionId: "test-redemption-id",
                rewardId: savedReward.id,
                rewardCost: savedReward.twitchData.cost,
                rewardImage: savedReward.twitchData.image ? savedReward.twitchData.image.url4x : savedReward.twitchData.defaultImage.url4x,
                rewardName: savedReward.twitchData.title,
                username: AccountAccess.getAccounts().streamer.displayName,
                userId: "",
                userDisplayName: ""
            }, true);
        });

        frontendCommunicator.onAsync("refresh-channel-reward-redemptions", async () => {
            await this.refreshChannelRewardRedemptions();
        });

        frontendCommunicator.onAsync("approve-reject-channel-reward-redemptions", async (request: RewardRedemptionsApprovalRequest) => {
            await this.approveOrRejectChannelRewardRedemptions(request);
        });

        frontendCommunicator.onAsync("approve-reject-channel-all-redemptions-for-rewards", async (request: { rewardIds: string[], approve?: boolean }) => {
            await this.approveOrRejectAllRedemptionsForChannelRewards(request.rewardIds, request.approve);
        });
    }

    getChannelRewardsDb(): JsonDB {
        return ProfileManager.getJsonDbInProfile("channel-rewards");
    }

    async loadChannelRewards() {
        logger.debug(`Attempting to load channel rewards...`);

        try {
            // Load existing reward data
            const channelRewardsData = (this.getChannelRewardsDb().getData("/") || {}) as Record<string, SavedChannelReward>;
            const rewards = Object.values(channelRewardsData);

            // Get all manageable rewards from Twitch
            const twitchManageableRewards: CustomReward[] = await TwitchApi.channelRewards.getManageableCustomChannelRewards();
            if (twitchManageableRewards == null) {
                logger.error("Manageable Twitch channel rewards returned null!");
                this.channelRewards = channelRewardsData;

                this._eligible = false;
                frontendCommunicator.send("channel-rewards-eligibility-changed", false);

                return;
            }

            // Determine new manageable rewards
            const newManageableChannelRewards = twitchManageableRewards
                .filter(nr => rewards.every(r => r.id !== nr.id))
                .map((nr) => {
                    return {
                        id: nr.id,
                        manageable: true,
                        twitchData: nr
                    };
                });

            // Get all unmanageable rewards from Twitch
            const twitchUnmanageableRewards = await TwitchApi.channelRewards.getUnmanageableCustomChannelRewards();
            if (twitchUnmanageableRewards == null) {
                logger.error("Unmanageable Twitch channel rewards returned null!");
                this.channelRewards = channelRewardsData;

                this._eligible = false;
                frontendCommunicator.send("channel-rewards-eligibility-changed", false);

                return;
            }

            // Determine new unmanageable rewards
            const newTwitchUnmanageableRewards: SavedChannelReward[] = twitchUnmanageableRewards
                .filter(ur => rewards.every(r => r.id !== ur.id))
                .map((ur) => {
                    return {
                        id: ur.id,
                        manageable: false,
                        twitchData: ur
                    };
                });

            // Sync current reward Twitch data/manageability status, remove deleted rewards, then add new rewards
            const syncedRewards: Record<string, SavedChannelReward> = rewards.map((r) => {
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

            frontendCommunicator.send("channel-rewards-updated", Object.values(this.channelRewards));
            this._eligible = true;
            frontendCommunicator.send("channel-rewards-eligibility-changed", true);
        } catch (err) {
            logger.warn(`There was an error reading channel rewards file.`, err);
        }
    }

    async saveChannelReward(channelReward: SavedChannelReward, emitUpdateEvent = false) {
        if (channelReward == null) {
            return null;
        }

        if (channelReward.id == null) {
            const twitchData = await TwitchApi.channelRewards.createCustomChannelReward(channelReward.twitchData);
            if (twitchData == null) {
                return null;
            }
            channelReward.twitchData = twitchData;
            channelReward.id = twitchData.id;
        } else if (channelReward.manageable) {
            await TwitchApi.channelRewards.updateCustomChannelReward(channelReward.twitchData);
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

    saveTwitchDataForChannelReward(twitchData: CustomReward) {
        if (!twitchData || !twitchData.id) {
            return null;
        }

        let channelReward: SavedChannelReward;

        if (!this.channelRewards[twitchData.id]) {
            channelReward = {
                id: twitchData.id,
                twitchData,
                manageable: false
            };
        } else {
            channelReward = this.channelRewards[twitchData.id];
            channelReward.twitchData = twitchData;
        }

        this.channelRewards[twitchData.id] = channelReward;

        try {
            const channelRewardsDb = this.getChannelRewardsDb();

            channelRewardsDb.push(`/${channelReward.id}`, channelReward);

            frontendCommunicator.send("channel-reward-updated", channelReward);

            return channelReward;
        } catch (err) {
            logger.warn(`There was an error saving a channel reward from Twitch data.`, err);
            return null;
        }
    }

    async saveAllChannelRewards(allChannelRewards: SavedChannelReward[], updateTwitch = false): Promise<void> {
        if (updateTwitch) {
            for (const channelReward of allChannelRewards) {
                await TwitchApi.channelRewards.updateCustomChannelReward(channelReward.twitchData);
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
        }
    }

    async deleteChannelReward(channelRewardId: string, propagateToTwitch = true, notifyFrontend = false) {
        if (channelRewardId == null || this.channelRewards[channelRewardId] == null) {
            return;
        }

        delete this.channelRewards[channelRewardId];
        delete this._channelRewardRedemptions[channelRewardId];

        try {
            const channelRewardsDb = this.getChannelRewardsDb();

            channelRewardsDb.delete(`/${channelRewardId}`);

            if (propagateToTwitch) {
                await TwitchApi.channelRewards.deleteCustomChannelReward(channelRewardId);
            }

            if (notifyFrontend) {
                frontendCommunicator.send("channel-reward-deleted", channelRewardId);
            }

            logger.debug(`Deleted channel reward: ${channelRewardId}`);

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

    private async triggerRewardEffects(metadata: RewardRedemptionMetadata, effectList?: EffectList, manual = false): Promise<void> {
        if (effectList == null || effectList.list == null) {
            return;
        }

        const processEffectsRequest = {
            trigger: {
                type: manual ? "manual" : "channel_reward",
                metadata: metadata
            } as Trigger,
            effects: effectList
        };

        try {
            await effectRunner.processEffects(processEffectsRequest);
        } catch (reason) {
            logger.error(`error when running effects: ${reason}`);
        }
    }

    async triggerChannelReward(rewardId: string, metadata: RewardRedemptionMetadata, manual = false): Promise<boolean | void> {
        const savedReward = this.channelRewards[rewardId];
        if (metadata.username && metadata.userId && metadata.userDisplayName) {
            /*
            If all user data is present mark user as active
            handles use from src/backend/events/twitch-events/reward-redemption.ts
            the two other uses of triggerChannel reward do not have this data and are initiated by the streamer
            retrigger-event and manually-trigger-reward and as such should not set a user as active
            */
            await ActiveUserHandler.addActiveUser({ userName: metadata.username, userId: metadata.userId, displayName: metadata.userDisplayName }, true);
        }
        if (savedReward == null || savedReward.effects == null || savedReward.effects.list == null) {
            return;
        }

        const restrictionData = savedReward.restrictionData;
        if (restrictionData) {
            logger.debug("Reward has restrictions...checking them.");
            const triggerData: Trigger = {
                type: "channel_reward",
                metadata
            };

            const shouldAutoApproveOrReject = savedReward.manageable &&
                !savedReward.twitchData.shouldRedemptionsSkipRequestQueue &&
                savedReward.autoApproveRedemptions;

            try {
                await RestrictionsManager.runRestrictionPredicates(triggerData, savedReward.restrictionData);
                logger.debug("Restrictions passed!");
                if (shouldAutoApproveOrReject) {
                    logger.debug("auto accepting redemption");
                    void this.approveOrRejectChannelRewardRedemptions({
                        rewardId,
                        redemptionIds: [metadata.redemptionId],
                        approve: true
                    });
                }
            } catch (restrictionReason) {
                let reason: string;
                if (Array.isArray(restrictionReason)) {
                    reason = restrictionReason.join(", ");
                } else {
                    reason = restrictionReason as string;
                }

                logger.debug(`${metadata.username} could not use Reward '${savedReward.twitchData.title}' because: ${reason}`);
                if (restrictionData.sendFailMessage || restrictionData.sendFailMessage == null) {

                    const restrictionMessage = restrictionData.useCustomFailMessage ?
                        restrictionData.failMessage :
                        "Sorry @{user}, you cannot use this channel reward because: {reason}";

                    await TwitchApi.chat.sendChatMessage(
                        restrictionMessage
                            .replaceAll("{user}", metadata.username)
                            .replaceAll("{reason}", reason),
                        null,
                        true
                    );
                }

                if (shouldAutoApproveOrReject) {
                    logger.debug("auto rejecting redemption");
                    void this.approveOrRejectChannelRewardRedemptions({
                        rewardId,
                        redemptionIds: [metadata.redemptionId],
                        approve: false
                    });
                }

                return false;
            }
        }

        return this.triggerRewardEffects(metadata, savedReward.effects, manual);
    }

    async triggerChannelRewardFulfilled(rewardId: string, metadata: RewardRedemptionMetadata, manual = false): Promise<void> {
        const savedReward = this.channelRewards[rewardId];
        if (savedReward == null) {
            return;
        }

        return this.triggerRewardEffects(metadata, savedReward.effectsFulfilled, manual);
    }

    async triggerChannelRewardCanceled(rewardId: string, metadata: RewardRedemptionMetadata, manual = false): Promise<void> {
        const savedReward = this.channelRewards[rewardId];
        if (savedReward == null) {
            return;
        }

        return this.triggerRewardEffects(metadata, savedReward.effectsCanceled, manual);
    }

    async refreshChannelRewardRedemptions(): Promise<void> {
        if (AccountAccess.getAccounts().streamer.broadcasterType === "") {
            return;
        }

        this._channelRewardRedemptions = await TwitchApi.channelRewards.getOpenChannelRewardRedemptions();

        frontendCommunicator.send("channel-reward-redemptions-updated", this.getChannelRewardRedemptions());
    }

    addRewardRedemption(rewardId: string, redemption: RewardRedemption): void {
        if (this._channelRewardRedemptions[rewardId] == null) {
            this._channelRewardRedemptions[rewardId] = [];
        }

        this._channelRewardRedemptions[rewardId].push(redemption);

        frontendCommunicator.send("channel-reward-redemptions-updated", this.getChannelRewardRedemptions());
    }

    removeRewardRedemption(rewardId: string, redemptionId: string): void {
        const redemptions = this._channelRewardRedemptions[rewardId];
        if (redemptions) {
            this._channelRewardRedemptions[rewardId] = redemptions.filter(r => r.id !== redemptionId);

            frontendCommunicator.send("channel-reward-redemptions-updated", this.getChannelRewardRedemptions());
        }
    }

    getChannelRewardRedemptions(): Record<string, RewardRedemption[]> {
        return this._channelRewardRedemptions ?? {};
    }

    async approveOrRejectChannelRewardRedemptions(request: RewardRedemptionsApprovalRequest): Promise<void> {
        await TwitchApi.channelRewards.approveOrRejectChannelRewardRedemption(request);
    }

    async approveOrRejectAllRedemptionsForChannelRewards(rewardIds: string[], approve = true): Promise<void> {
        await TwitchApi.channelRewards.approveOrRejectAllRedemptionsForChannelRewards(rewardIds, approve);
    }
}

const channelRewardManager = new ChannelRewardManager();

export = channelRewardManager;