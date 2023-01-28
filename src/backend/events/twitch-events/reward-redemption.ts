import eventManager from "../EventManager";
import frontendCommunicator from "../../common/frontend-communicator";
import rewardManager from "../../channel-rewards/channel-reward-manager";

export function handleRewardRedemption(
    redemptionId: string,
    status: string,
    isQueued: boolean,
    messageText: string,
    userId: string,
    userName: string,
    userDisplayName: string,
    rewardId: string,
    rewardTitle: string,
    rewardPrompt: string,
    rewardCost: number,
    rewardImageUrl: string
): void {
    frontendCommunicator.send("twitch:chat:rewardredemption", {
        id: redemptionId,
        status,
        queued: isQueued,
        messageText,
        user: {
            id: userId,
            username: userName
        },
        reward: {
            id: rewardId,
            name: rewardTitle,
            cost: rewardCost,
            imageUrl: rewardImageUrl
        }
    });

    setTimeout(() => {
        const redemptionMeta = {
            username: userDisplayName,
            messageText,
            redemptionId,
            rewardId,
            rewardImage: rewardImageUrl,
            rewardName: rewardTitle,
            rewardDescription: rewardPrompt,
            rewardCost: rewardCost
        };

        rewardManager.triggerChannelReward(rewardId, redemptionMeta);
        eventManager.triggerEvent("twitch", "channel-reward-redemption", redemptionMeta);
    }, 100);
};