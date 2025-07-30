import eventManager from "../../events/EventManager";

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
