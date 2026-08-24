import type { EffectList } from "./effects";
import type { RestrictionData } from "./restrictions";

export interface CustomRewardImageSet {
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
    image?: CustomRewardImageSet;
    defaultImage: CustomRewardImageSet;
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

export type SavedChannelReward = {
    id: string;
    twitchData: CustomReward;
    manageable: boolean;
    effects?: EffectList;
    effectsFulfilled?: EffectList;
    effectsCanceled?: EffectList;
    restrictionData?: RestrictionData;
    autoApproveRedemptions?: boolean;
};

export type RewardRedemptionMetadata = {
    username: string;
    userId: string;
    userDisplayName: string;
    messageText: string;
    redemptionId: string;
    rewardId: string;
    rewardImage: string;
    rewardName: string;
    rewardCost: number;
};