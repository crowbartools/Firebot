import eventManager from "../../events/EventManager";

export function triggerCheer(
    username: string,
    userId: string,
    userDisplayName: string,
    bits: number,
    totalBits: number,
    cheerMessage: string
): void {
    eventManager.triggerEvent("twitch", "cheer", {
        username,
        userId,
        userDisplayName,
        isAnonymous: false,
        bits,
        totalBits,
        cheerMessage
    });
}

export function triggerBitsBadgeUnlock(
    username: string,
    userId: string,
    userDisplayName: string,
    message: string,
    badgeTier: number
): void {
    eventManager.triggerEvent("twitch", "bits-badge-unlocked", {
        username,
        userId,
        userDisplayName,
        message,
        badgeTier
    });
}

export function triggerPowerupMessageEffect(
    username: string,
    userId: string,
    userDisplayName: string,
    bits: number,
    totalBits: number,
    cheerMessage: string
): void {
    eventManager.triggerEvent("twitch", "bits-powerup-message-effect", {
        username,
        userId,
        userDisplayName,
        isAnonymous: false,
        bits,
        totalBits,
        cheerMessage
    });
}

export function triggerPowerupCelebration(
    username: string,
    userId: string,
    userDisplayName: string,
    bits: number,
    totalBits: number
): void {
    eventManager.triggerEvent("twitch", "bits-powerup-celebration", {
        username,
        userId,
        userDisplayName,
        isAnonymous: false,
        bits,
        totalBits
    });
}

export function triggerPowerupGigantifyEmote(
    username: string,
    userId: string,
    userDisplayName: string,
    bits: number,
    totalBits: number,
    cheerMessage: string,
    emoteName: string,
    emoteUrl: string
): void {
    eventManager.triggerEvent("twitch", "bits-powerup-gigantified-emote", {
        username,
        userId,
        userDisplayName,
        isAnonymous: false,
        bits,
        totalBits,
        cheerMessage,
        emoteName,
        emoteUrl
    });
}