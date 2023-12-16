import { CustomReward } from "../backend/twitch-api/resource/channel-rewards"

export type SavedChannelReward = {
    id: string,
    twitchData: CustomReward,
    manageable: boolean,
    effects?: {
        id: string,
        list: any[]
    }
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