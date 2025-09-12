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

export function triggerRedemptionSingleMessageBypassSubMode(
    username: string,
    userId: string,
    userDisplayName: string,
    channelPoints: number
): void {
    const rewardDescription = "Send a Message in Sub-Only Mode";
    eventManager.triggerEvent("twitch", "channel-points-redemption-single-message-bypass-sub-mode", {
        username,
        userId,
        userDisplayName,
        channelPoints,
        rewardDescription
    });
}

export function triggerRedemptionSendHighlightedMessage(
    username: string,
    userId: string,
    userDisplayName: string,
    channelPoints: number,
    messageText: string
): void {
    const rewardDescription = "Highlight My Message";
    eventManager.triggerEvent("twitch", "channel-points-redemption-send-highlighted-message", {
        username,
        userId,
        userDisplayName,
        channelPoints,
        messageText,
        rewardDescription
    });
}

export function triggerRedemptionRandomSubEmoteUnlock(
    username: string,
    userId: string,
    userDisplayName: string,
    channelPoints: number,
    emoteName: string,
    emoteUrl: string
): void {
    const rewardDescription = "Unlock a Random Sub Emote";
    eventManager.triggerEvent("twitch", "channel-points-redemption-random-sub-emote-unlock", {
        username,
        userId,
        userDisplayName,
        channelPoints,
        emoteName,
        emoteUrl,
        rewardDescription
    });
}

export function triggerRedemptionChosenSubEmoteUnlock(
    username: string,
    userId: string,
    userDisplayName: string,
    channelPoints: number,
    emoteName: string,
    emoteUrl: string
): void {
    const rewardDescription = "Choose an Emote to Unlock";
    eventManager.triggerEvent("twitch", "channel-points-redemption-chosen-sub-emote-unlock", {
        username,
        userId,
        userDisplayName,
        channelPoints,
        emoteName,
        emoteUrl,
        rewardDescription
    });
}

export function triggerRedemptionChosenModifiedSubEmoteUnlock(
    username: string,
    userId: string,
    userDisplayName: string,
    channelPoints: number,
    emoteName: string,
    emoteUrl: string
): void {
    const rewardDescription = "Modify a Single Emote";
    eventManager.triggerEvent("twitch", "channel-points-redemption-chosen-modified-sub-emote-unlock", {
        username,
        userId,
        userDisplayName,
        channelPoints,
        emoteName,
        emoteUrl,
        rewardDescription
    });
}
