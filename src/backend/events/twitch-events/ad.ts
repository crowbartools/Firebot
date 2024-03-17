import eventManager from "../EventManager";

export function triggerAdBreakStart(
    username: string,
    userId: string,
    userDisplayName: string,
    adBreakDuration: number,
    isAdBreakScheduled: boolean
): void {
    eventManager.triggerEvent("twitch", "ad-break-start", {
        username,
        userId,
        userDisplayName,
        adBreakDuration,
        isAdBreakScheduled
    });
}

export function triggerAdBreakEnd(
    username: string,
    userId: string,
    userDisplayName: string,
    adBreakDuration: number,
    isAdBreakScheduled: boolean
): void {
    eventManager.triggerEvent("twitch", "ad-break-end", {
        username,
        userId,
        userDisplayName,
        adBreakDuration,
        isAdBreakScheduled
    });
}