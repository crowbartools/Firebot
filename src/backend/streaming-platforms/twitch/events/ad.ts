import adManager from "../ad-manager";
import { EventManager } from "../../../events/event-manager";

export function triggerAdBreakStart(
    username: string,
    userId: string,
    userDisplayName: string,
    adBreakStart: Date,
    adBreakDuration: number,
    isAdBreakScheduled: boolean
): void {
    const adBreakEnd = new Date(adBreakStart.getTime());
    adBreakEnd.setSeconds(adBreakStart.getSeconds() + adBreakDuration);

    void EventManager.triggerEvent("twitch", "ad-break-start", {
        username,
        userId,
        userDisplayName,
        adBreakStart,
        adBreakEnd,
        adBreakDuration,
        isAdBreakScheduled
    });

    adManager.triggerAdBreakStart(adBreakDuration, adBreakEnd);
}

export function triggerAdBreakEnd(
    username: string,
    userId: string,
    userDisplayName: string,
    adBreakDuration: number,
    isAdBreakScheduled: boolean
): void {
    void EventManager.triggerEvent("twitch", "ad-break-end", {
        username,
        userId,
        userDisplayName,
        adBreakDuration,
        isAdBreakScheduled
    });

    adManager.triggerAdBreakComplete();
}