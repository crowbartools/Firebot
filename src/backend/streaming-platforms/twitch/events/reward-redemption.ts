import { EventManager } from "../../../events/event-manager";
import rewardManager from "../../../channel-rewards/channel-reward-manager";
import frontendCommunicator from "../../../common/frontend-communicator";

export function handleRewardRedemption(
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
    frontendCommunicator.send("twitch:chat:rewardredemption", {
        id: redemptionId,
        status,
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
            imageUrl: rewardImageUrl ?? "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png"
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

        void rewardManager.triggerChannelReward(rewardId, redemptionMeta);
        void void EventManager.triggerEvent("twitch", "channel-reward-redemption", redemptionMeta);
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
        void rewardManager.triggerChannelRewardFulfilled(rewardId, redemptionMeta);
        void void EventManager.triggerEvent("twitch", "channel-reward-redemption-fulfilled", redemptionMeta);
    } else {
        void rewardManager.triggerChannelRewardCanceled(rewardId, redemptionMeta);
        void void EventManager.triggerEvent("twitch", "channel-reward-redemption-canceled", redemptionMeta);
    }
}

export function triggerRedemptionSingleMessageBypassSubMode(
    username: string,
    userId: string,
    userDisplayName: string,
    rewardCost: number
): void {
    const rewardDescription = "Send a Message in Sub-Only Mode";
    void void EventManager.triggerEvent("twitch", "channel-reward-redemption-single-message-bypass-sub-mode", {
        username,
        userId,
        userDisplayName,
        rewardCost,
        rewardDescription
    });
}

export function triggerRedemptionSendHighlightedMessage(
    username: string,
    userId: string,
    userDisplayName: string,
    rewardCost: number,
    messageText: string
): void {
    const rewardDescription = "Highlight My Message";
    void void EventManager.triggerEvent("twitch", "channel-reward-redemption-send-highlighted-message", {
        username,
        userId,
        userDisplayName,
        rewardCost,
        messageText,
        rewardDescription
    });
}

export function triggerRedemptionRandomSubEmoteUnlock(
    username: string,
    userId: string,
    userDisplayName: string,
    rewardCost: number,
    emoteName: string,
    emoteUrl: string
): void {
    const rewardDescription = "Unlock a Random Sub Emote";
    void void EventManager.triggerEvent("twitch", "channel-reward-redemption-random-sub-emote-unlock", {
        username,
        userId,
        userDisplayName,
        rewardCost,
        emoteName,
        emoteUrl,
        rewardDescription
    });
}

export function triggerRedemptionChosenSubEmoteUnlock(
    username: string,
    userId: string,
    userDisplayName: string,
    rewardCost: number,
    emoteName: string,
    emoteUrl: string
): void {
    const rewardDescription = "Choose an Emote to Unlock";
    void void EventManager.triggerEvent("twitch", "channel-reward-redemption-chosen-sub-emote-unlock", {
        username,
        userId,
        userDisplayName,
        rewardCost,
        emoteName,
        emoteUrl,
        rewardDescription
    });
}

export function triggerRedemptionChosenModifiedSubEmoteUnlock(
    username: string,
    userId: string,
    userDisplayName: string,
    rewardCost: number,
    emoteName: string,
    emoteUrl: string
): void {
    const rewardDescription = "Modify a Single Emote";
    void void EventManager.triggerEvent("twitch", "channel-reward-redemption-chosen-modified-sub-emote-unlock", {
        username,
        userId,
        userDisplayName,
        rewardCost,
        emoteName,
        emoteUrl,
        rewardDescription
    });
}