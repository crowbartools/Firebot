import { EventManager } from "../../../events/event-manager";
import powerUpsManager from "../../../power-ups/power-ups-manager";
import frontendCommunicator from "../../../common/frontend-communicator";
import { EventSubChannelBitsUseMessagePart } from "../api/twurple-private-types";

export function triggerCheer(
    username: string,
    userId: string,
    userDisplayName: string,
    bits: number,
    totalBits: number,
    cheerMessage: string,
    cheerMessageParts: EventSubChannelBitsUseMessagePart[]
): void {
    void EventManager.triggerEvent("twitch", "cheer", {
        username,
        userId,
        userDisplayName,
        isAnonymous: false,
        bits,
        totalBits,
        cheerMessage,
        cheerMessageParts
    });
}

export function triggerBitsBadgeUnlock(
    username: string,
    userId: string,
    userDisplayName: string,
    message: string,
    badgeTier: number
): void {
    void EventManager.triggerEvent("twitch", "bits-badge-unlocked", {
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
    void EventManager.triggerEvent("twitch", "bits-powerup-message-effect", {
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
    void EventManager.triggerEvent("twitch", "bits-powerup-celebration", {
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
    void EventManager.triggerEvent("twitch", "bits-powerup-gigantified-emote", {
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

export function handleCustomPowerUpRedemption(
    redemptionId: string,
    status: string,
    messageText: string,
    userId: string,
    username: string,
    userDisplayName: string,
    powerUpId: string,
    powerUpTitle: string,
    powerUpPrompt: string,
    powerUpCost: number,
    powerUpImageUrl: string
): void {
    frontendCommunicator.send("twitch:chat:twitch:chat:powerupredemption", {
        id: redemptionId,
        status,
        messageText,
        user: {
            id: userId,
            username,
            displayName: userDisplayName
        },
        powerUp: {
            id: powerUpId,
            name: powerUpTitle,
            bits: powerUpCost,
            imageUrl:
                powerUpImageUrl ??
                "https://static-cdn.jtvnw.net/twilight-static-assets/Default-Power-up-Line-Lightshade-112x112.png"
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
            powerUpId,
            powerUpImage: powerUpImageUrl,
            powerUpName: powerUpTitle,
            powerUpDescription: powerUpPrompt,
            powerUpCost
        };

        void void EventManager.triggerEvent("twitch", "power-up-redemption", redemptionMeta);

        void powerUpsManager.triggerPowerUp(powerUpId, {
            username,
            userId,
            userDisplayName,
            messageText,
            powerUpId,
            powerUpImage: powerUpImageUrl,
            powerUpName: powerUpTitle,
            bits: powerUpCost
        });
    }, 100);
}
