import { EventManager } from "../../../events/event-manager";
import frontendCommunicator from "../../../common/frontend-communicator";

export function triggerCheer(
    username: string,
    userId: string,
    userDisplayName: string,
    bits: number,
    totalBits: number,
    cheerMessage: string
): void {
    void EventManager.triggerEvent("twitch", "cheer", {
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
    powerUpBits: number,
    powerUpImageUrl: string
): void {
    // frontendCommunicator.send("twitch:chat:rewardredemption", {
    //     id: redemptionId,
    //     status,
    //     messageText,
    //     user: {
    //         id: userId,
    //         username,
    //         displayName: userDisplayName
    //     },
    //     powerUp: {
    //         id: powerUpId,
    //         name: powerUpTitle,
    //         bits: powerUpBits,
    //         imageUrl: powerUpImageUrl ?? "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png"
    //     }
    // });

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
            powerUpBits
        };

        void void EventManager.triggerEvent("twitch", "custom-power-up-redemption", redemptionMeta);
    }, 100);
}
