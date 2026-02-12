import type { CustomReward } from "../backend/streaming-platforms/twitch/api/resource/channel-rewards";
import type { EffectList } from "./effects";
import type { RestrictionData } from "./restrictions";

export type SavedChannelReward = {
    firebotId: string;
    id: string;
    twitchData: CustomReward;
    manageable: boolean;
    deletedOnTwitch?: boolean;
    previousTwitchIds?: string[];
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
    firebotRewardId?: string;
    rewardImage: string;
    rewardName: string;
    rewardCost: number;
};