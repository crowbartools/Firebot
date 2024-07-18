import eventManager from "../EventManager";
import frontendCommunicator from "../../common/frontend-communicator";
import rewardManager from "../../channel-rewards/channel-reward-manager";

export function handleRewardRedemption(
    redemptionId: string,
    status: string,
    isQueued: boolean,
    messageText: string,
    userId: string,
    username: string,
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
            username,
            displayName: userDisplayName
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
            username,
            userId,
            userDisplayName,
            messageText,
            args: (messageText ?? "").split(" "),
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
}

export function handleRewardUpdated(
    redemptionId: string,
    status: string,
    messageText: string,
    userId: string,
    username: string,
    userDisplayName: string,
    rewardId: string,
    rewardTitle: string,
    rewardPrompt: string,
    rewardCost: number,
    rewardImageUrl: string
): void {
    const redemptionMeta = {
        username,
        userId,
        userDisplayName,
        messageText,
        args: (messageText ?? "").split(" "),
        redemptionId,
        rewardId,
        rewardImage: rewardImageUrl,
        rewardName: rewardTitle,
        rewardDescription: rewardPrompt,
        rewardCost: rewardCost
    };

    // Possible values for status are 'fulfilled' and 'canceled' according to Twitch docs
    if (status === 'fulfilled') {
        rewardManager.triggerChannelRewardFulfilled(rewardId, redemptionMeta);
        eventManager.triggerEvent("twitch", "channel-reward-redemption-fulfilled", redemptionMeta);
    } else {
        rewardManager.triggerChannelRewardCanceled(rewardId, redemptionMeta);
        eventManager.triggerEvent("twitch", "channel-reward-redemption-canceled", redemptionMeta);
    }
}