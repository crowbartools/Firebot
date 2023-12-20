import { CustomReward } from "../backend/twitch-api/resource/channel-rewards";
import { EffectList } from "./effects";

export type SavedChannelReward = {
    id: string,
    twitchData: CustomReward,
    manageable: boolean,
    effects?: EffectList
};

export type RewardRedemptionMetadata = {
    username: string,
    messageText: string,
    redemptionId: string,
    rewardId: string,
    rewardImage: string,
    rewardName: string,
    rewardCost: number
};