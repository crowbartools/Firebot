import logger from "../../logwrapper";
import accountAccess from "../../common/account-access";
import {
    ApiClient,
    HelixCustomReward,
    HelixCreateCustomRewardData,
    HelixUpdateCustomRewardData,
    HelixCustomRewardRedemption,
    HelixCustomRewardRedemptionFilter
} from "@twurple/api";
import { chunkArray } from "../../utils/chunkArray";

export interface ImageSet {
    url1x: string;
    url2x: string;
    url4x: string;
}

export interface CustomReward {
    broadcasterId: string;
    broadcasterLogin: string;
    broadcasterName: string;
    id: string;
    title: string;
    prompt: string;
    cost: number;
    image?: ImageSet;
    defaultImage: ImageSet;
    backgroundColor: string;
    isEnabled: boolean;
    isUserInputRequired: boolean;
    maxPerStreamSetting: {
        isEnabled: boolean;
        maxPerStream: number;
    };
    maxPerUserPerStreamSetting: {
        isEnabled: boolean;
        maxPerUserPerStream: number;
    };
    globalCooldownSetting: {
        isEnabled: boolean;
        globalCooldownSeconds: number;
    };
    isPaused: boolean;
    isInStock: boolean;
    shouldRedemptionsSkipRequestQueue: boolean;
    redemptionsRedeemedCurrentStream?: number;
    cooldownExpiresAt?: Date;
}

export interface RewardRedemption {
    id: string;
    rewardId: string;
    redemptionDate: Date;
    userId: string;
    userName: string;
    userDisplayName: string;
    rewardMessage?: string;
}

export interface RewardRedemptionsApprovalRequest {
    rewardId: string;
    redemptionIds?: string[];
    approve?: boolean;
}

export class TwitchChannelRewardsApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    private mapCustomRewardToCreateRewardPayload(reward: CustomReward): HelixCreateCustomRewardData {
        let maxRedemptionsPerStream = null, maxRedemptionsPerUserPerStream = null, globalCooldown = null;

        if (reward.maxPerStreamSetting?.isEnabled === true && reward.maxPerStreamSetting?.maxPerStream > 0) {
            maxRedemptionsPerStream = reward.maxPerStreamSetting.maxPerStream;
        }

        if (reward.maxPerUserPerStreamSetting?.isEnabled === true && reward.maxPerUserPerStreamSetting?.maxPerUserPerStream > 0) {
            maxRedemptionsPerUserPerStream = reward.maxPerUserPerStreamSetting.maxPerUserPerStream;
        }

        if (reward.globalCooldownSetting?.isEnabled === true && reward.globalCooldownSetting?.globalCooldownSeconds > 0) {
            globalCooldown = reward.globalCooldownSetting.globalCooldownSeconds;
        }

        return {
            title: reward.title,
            prompt: reward.prompt,
            cost: reward.cost,
            isEnabled: reward.isEnabled,
            backgroundColor: reward.backgroundColor,
            userInputRequired: reward.isUserInputRequired,
            maxRedemptionsPerStream: maxRedemptionsPerStream,
            maxRedemptionsPerUserPerStream: maxRedemptionsPerUserPerStream,
            globalCooldown: globalCooldown,
            autoFulfill: reward.shouldRedemptionsSkipRequestQueue
        };
    }

    private mapCustomRewardToUpdateRewardPayload(reward: CustomReward): HelixUpdateCustomRewardData {
        let maxRedemptionsPerStream = null, maxRedemptionsPerUserPerStream = null, globalCooldown = null;

        if (reward.maxPerStreamSetting?.isEnabled === true && reward.maxPerStreamSetting?.maxPerStream > 0) {
            maxRedemptionsPerStream = reward.maxPerStreamSetting.maxPerStream;
        }

        if (reward.maxPerUserPerStreamSetting?.isEnabled === true && reward.maxPerUserPerStreamSetting?.maxPerUserPerStream > 0) {
            maxRedemptionsPerUserPerStream = reward.maxPerUserPerStreamSetting.maxPerUserPerStream;
        }

        if (reward.globalCooldownSetting?.isEnabled === true && reward.globalCooldownSetting?.globalCooldownSeconds > 0) {
            globalCooldown = reward.globalCooldownSetting.globalCooldownSeconds;
        }

        return {
            title: reward.title,
            prompt: reward.prompt,
            cost: reward.cost,
            isEnabled: reward.isEnabled,
            backgroundColor: reward.backgroundColor,
            userInputRequired: reward.isUserInputRequired,
            maxRedemptionsPerStream: maxRedemptionsPerStream,
            maxRedemptionsPerUserPerStream: maxRedemptionsPerUserPerStream,
            globalCooldown: globalCooldown,
            isPaused: reward.isPaused,
            autoFulfill: reward.shouldRedemptionsSkipRequestQueue
        };
    }

    private mapCustomRewardResponse(reward: HelixCustomReward): CustomReward {
        const image: ImageSet = {
            url1x: reward.getImageUrl(1),
            url2x: reward.getImageUrl(2),
            url4x: reward.getImageUrl(4)
        };

        return {
            broadcasterId: reward.broadcasterId,
            broadcasterLogin: reward.broadcasterName,
            broadcasterName: reward.broadcasterDisplayName,
            id: reward.id,
            title: reward.title,
            prompt: reward.prompt,
            cost: reward.cost,
            image: image,
            defaultImage: image,
            backgroundColor: reward.backgroundColor,
            isEnabled: reward.isEnabled,
            isUserInputRequired: reward.userInputRequired,
            maxPerStreamSetting: {
                isEnabled: reward.maxRedemptionsPerStream !== null,
                maxPerStream: reward.maxRedemptionsPerStream
            },
            maxPerUserPerStreamSetting: {
                isEnabled: reward.maxRedemptionsPerUserPerStream !== null,
                maxPerUserPerStream: reward.maxRedemptionsPerUserPerStream
            },
            globalCooldownSetting: {
                isEnabled: reward.globalCooldown !== null,
                globalCooldownSeconds: reward.globalCooldown
            },
            isPaused: reward.isPaused,
            isInStock: reward.isInStock,
            shouldRedemptionsSkipRequestQueue: reward.autoFulfill,
            cooldownExpiresAt: reward.cooldownExpiryDate
        };
    }

    private mapCustomRewardRedemptionResponse(redemption: HelixCustomRewardRedemption): RewardRedemption {
        return {
            id: redemption.id,
            rewardId: redemption.rewardId,
            redemptionDate: redemption.redemptionDate,
            userId: redemption.userId,
            userName: redemption.userName,
            userDisplayName: redemption.userDisplayName,
            rewardMessage: redemption.userInput
        };
    }

    /**
     * Get an array of custom channel rewards
     * @param {boolean} onlyManageable - Only get rewards manageable by Firebot
     */
    async getCustomChannelRewards(onlyManageable = false): Promise<CustomReward[]> {
        let rewards = [];
        try {
            const response = await this._streamerClient?.channelPoints?.getCustomRewards(
                accountAccess.getAccounts().streamer.userId,
                onlyManageable
            );
            if (response) {
                rewards = response;
            } else {
                return null;
            }
        } catch (err) {
            logger.error("Failed to get twitch custom channel rewards", err.message);
            return null;
        }
        return rewards.map(r => this.mapCustomRewardResponse(r));
    }

    async getCustomChannelReward(rewardId: string): Promise<CustomReward> {
        let reward: HelixCustomReward;

        try {
            const response = await this._streamerClient?.channelPoints?.getCustomRewardById(
                accountAccess.getAccounts().streamer.userId,
                rewardId
            );
            if (response) {
                reward = response;
            } else {
                return null;
            }
        } catch (err) {
            logger.error("Failed to get Twitch custom channel reward", err.message);
            return null;
        }

        return this.mapCustomRewardResponse(reward);
    }

    async getManageableCustomChannelRewards(): Promise<CustomReward[]> {
        return await this.getCustomChannelRewards(true);
    }

    async getUnmanageableCustomChannelRewards(): Promise<CustomReward[]> {
        const allRewards = await this.getCustomChannelRewards();
        const onlyManageable = await this.getManageableCustomChannelRewards();
        if (allRewards == null || onlyManageable == null) {
            return null;
        }
        const onlyUnmanageable = allRewards.filter(r => onlyManageable.every(mr => mr.id !== r.id));
        return onlyUnmanageable;
    }

    async getTotalChannelRewardCount(): Promise<number> {
        const rewards = await this.getCustomChannelRewards();
        return rewards?.length ?? 0;
    }

    async createCustomChannelReward(reward: CustomReward): Promise<CustomReward> {
        const data = this.mapCustomRewardToCreateRewardPayload(reward);

        try {
            const response = await this._streamerClient.channelPoints.createCustomReward(
                accountAccess.getAccounts().streamer.userId,
                data
            );

            return this.mapCustomRewardResponse(response);
        } catch (err) {
            logger.error("Failed to create twitch custom channel reward", err.message);
            return null;
        }
    }

    async updateCustomChannelReward(reward: CustomReward): Promise<boolean> {
        try {
            await this._streamerClient.channelPoints.updateCustomReward(
                accountAccess.getAccounts().streamer.userId,
                reward.id,
                this.mapCustomRewardToUpdateRewardPayload(reward)
            );
            return true;
        } catch (err) {
            logger.error("Failed to update twitch custom channel reward", err.message);
            return false;
        }
    }

    async deleteCustomChannelReward(rewardId: string): Promise<boolean> {
        try {
            await this._streamerClient.channelPoints.deleteCustomReward(accountAccess.getAccounts().streamer.userId, rewardId);
            return true;
        } catch (err) {
            logger.error("Failed to update twitch custom channel reward", err.message);
            return false;
        }
    }

    async getOpenChannelRewardRedemptions(): Promise<Record<string, RewardRedemption[]>> {
        const redemptions: Record<string, RewardRedemption[]> = {};

        try {
            const rewards = await this.getManageableCustomChannelRewards();
            const filter: HelixCustomRewardRedemptionFilter = {
                newestFirst: true
            };

            if (rewards?.length) {
                for (const reward of rewards) {
                    const response = await this._streamerClient.channelPoints.getRedemptionsForBroadcasterPaginated(
                        accountAccess.getAccounts().streamer.userId,
                        reward.id,
                        "UNFULFILLED",
                        filter
                    ).getAll();

                    redemptions[reward.id] = response.map(r => this.mapCustomRewardRedemptionResponse(r));
                }
            }
        } catch (error) {
            logger.warn(`There was an error retrieving channel reward redemptions.`, error);
        }

        return redemptions;
    }

    async approveOrRejectChannelRewardRedemption(request: RewardRedemptionsApprovalRequest): Promise<boolean> {
        const approve = request?.approve ?? true;
        try {
            const chunkedRedemptionIds = chunkArray(request.redemptionIds, 50);

            for (const chunk of chunkedRedemptionIds) {
                const response = await this._streamerClient.channelPoints.updateRedemptionStatusByIds(
                    accountAccess.getAccounts().streamer.userId,
                    request.rewardId,
                    chunk,
                    approve ? "FULFILLED" : "CANCELED"
                );

                logger.debug(`Redemptions ${chunk.join(",")} for channel reward ${request.rewardId} was ${response[0].isFulfilled ? "approved" : "rejected"}`);
            }

            return true;
        } catch (error) {
            logger.error(`Failed to ${approve ? "approve" : "reject"} channel reward redemption`, error.message);
            return false;
        }
    }

    async approveOrRejectAllRedemptionsForChannelRewards(rewardIds: string[], approve = true): Promise<boolean> {
        try {
            const filter: HelixCustomRewardRedemptionFilter = {
                newestFirst: true
            };

            for (const rewardId of rewardIds) {

                const redemptions = await this._streamerClient.channelPoints.getRedemptionsForBroadcasterPaginated(
                    accountAccess.getAccounts().streamer.userId,
                    rewardId,
                    "UNFULFILLED",
                    filter
                ).getAll();

                if (await this.approveOrRejectChannelRewardRedemption({
                    rewardId,
                    redemptionIds: redemptions.map(r => r.id),
                    approve
                }) !== true) {
                    logger.warn(`Could not complete ${approve ? "approving" : "rejecting"} all channel reward redemptions for ${rewardId}`);
                }
            }

            return true;
        } catch (error) {
            logger.error(`Failed to ${approve ? "approve" : "reject"} all channel reward redemptions for rewards ${rewardIds.join(", ")}`, error.message);
            return false;
        }
    }
}