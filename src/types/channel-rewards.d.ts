import type { CustomReward } from "../backend/streaming-platforms/twitch/api/resource/channel-rewards";
import type { EffectList } from "./effects";
import type { RestrictionData } from "./restrictions";

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