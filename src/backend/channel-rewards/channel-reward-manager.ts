import { JsonDB } from "node-json-db";
import logger from "../logwrapper";
import accountAccess from "../common/account-access";
import profileManager from "../common/profile-manager";
import frontendCommunicator from "../common/frontend-communicator";
import twitchApi from "../twitch-api/api";
import { CustomReward, RewardRedemption, RewardRedemptionsApprovalRequest } from "../twitch-api/resource/channel-rewards";
import { EffectTrigger } from "../../shared/effect-constants";
import { RewardRedemptionMetadata, SavedChannelReward } from "../../types/channel-rewards";
import { TriggerType } from "../common/EffectType";

class ChannelRewardManager {
    channelRewards: Record<string, SavedChannelReward> = {};
    private _channelRewardRedemptions: Record<string, RewardRedemption[]> = {};

    constructor() {
        frontendCommunicator.onAsync("get-channel-reward-count",
            twitchApi.channelRewards.getTotalChannelRewardCount);

        frontendCommunicator.onAsync("get-channel-rewards", async () => Object.values(this.channelRewards));

        frontendCommunicator.onAsync("save-channel-reward",
            (channelReward: SavedChannelReward) => this.saveChannelReward(channelReward));

        frontendCommunicator.onAsync("save-all-channel-rewards",
            async (data: { channelRewards: SavedChannelReward[]; updateTwitch: boolean}) =>
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

            const accountAccess = require("../common/account-access");

            this.triggerChannelReward(channelRewardId, {
                messageText: "Testing reward",
                redemptionId: "test-redemption-id",
                rewardId: savedReward.id,
                rewardCost: savedReward.twitchData.cost,
                rewardImage: savedReward.twitchData.image ? savedReward.twitchData.image.url4x : savedReward.twitchData.defaultImage.url4x,
                rewardName: savedReward.twitchData.title,
                username: accountAccess.getAccounts().streamer.displayName
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
                .map((nr) => {
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

        const restrictionData = savedReward.restrictionData;
        if (restrictionData) {
            logger.debug("Reward has restrictions...checking them.");
            const restrictionsManager = require("../restrictions/restriction-manager");
            const triggerData = {
                type: TriggerType.CHANNEL_REWARD,
                metadata
            };

            const shouldAutoApproveOrReject = savedReward.manageable &&
                !savedReward.twitchData.shouldRedemptionsSkipRequestQueue &&
                savedReward.autoApproveRedemptions;

            try {
                await restrictionsManager.runRestrictionPredicates(triggerData, savedReward.restrictionData);
                logger.debug("Restrictions passed!");
                if (shouldAutoApproveOrReject) {
                    logger.debug("auto accepting redemption");
                    this.approveOrRejectChannelRewardRedemptions({
                        rewardId,
                        redemptionIds: [metadata.redemptionId],
                        approve: true
                    });
                }
            } catch (restrictionReason) {
                let reason;
                if (Array.isArray(restrictionReason)) {
                    reason = restrictionReason.join(", ");
                } else {
                    reason = restrictionReason;
                }

                logger.debug(`${metadata.username} could not use Reward '${savedReward.twitchData.title}' because: ${reason}`);
                if (restrictionData.sendFailMessage || restrictionData.sendFailMessage == null) {

                    const restrictionMessage = restrictionData.useCustomFailMessage ?
                        restrictionData.failMessage :
                        "Sorry @{user}, you cannot use this channel reward because: {reason}";

                    const twitchChat = require("../chat/twitch-chat");
                    await twitchChat.sendChatMessage(
                        restrictionMessage
                            .replace("{user}", metadata.username)
                            .replace("{reason}", reason)
                    );
                }

                if (shouldAutoApproveOrReject) {
                    logger.debug("auto rejecting redemption");
                    this.approveOrRejectChannelRewardRedemptions({
                        rewardId,
                        redemptionIds: [metadata.redemptionId],
                        approve: false
                    });
                }

                return false;
            }
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

    async refreshChannelRewardRedemptions(): Promise<void> {
        if (accountAccess.getAccounts().streamer.broadcasterType === "") {
            return;
        }

        this._channelRewardRedemptions = await twitchApi.channelRewards.getOpenChannelRewardRedemptions();

        frontendCommunicator.send("channel-reward-redemptions-updated", this.getChannelRewardRedemptions());
    }

    getChannelRewardRedemptions(): Record<string, RewardRedemption[]> {
        return this._channelRewardRedemptions ?? {};
    }

    async approveOrRejectChannelRewardRedemptions(request: RewardRedemptionsApprovalRequest): Promise<void> {
        const successful = await twitchApi.channelRewards.approveOrRejectChannelRewardRedemption(request);

        if (successful) {
            await this.refreshChannelRewardRedemptions();
        }
    }

    async approveOrRejectAllRedemptionsForChannelRewards(rewardIds: string[], approve = true): Promise<void> {
        const successful = await twitchApi.channelRewards.approveOrRejectAllRedemptionsForChannelRewards(rewardIds, approve);

        if (successful) {
            await this.refreshChannelRewardRedemptions();
        }
    }
}

const channelRewardManager = new ChannelRewardManager();

export = channelRewardManager;