import { EventManager } from "../../../events/event-manager";

export function triggerSub(
    username: string,
    userId: string,
    userDisplayName: string,
    subPlan: string,
    totalMonths: number,
    subMessage: string,
    streak: number,
    isPrime: boolean,
    isResub: boolean
): void {
    void EventManager.triggerEvent("twitch", "sub", {
        username,
        userId,
        userDisplayName,
        subPlan,
        totalMonths,
        subMessage,
        streak,
        isPrime,
        isResub
    });
}

export function triggerPrimeUpgrade(
    username: string,
    userId: string,
    userDisplayName: string,
    subPlan: string
): void {
    void EventManager.triggerEvent("twitch", "prime-sub-upgraded", {
        username,
        userId,
        userDisplayName,
        subPlan
    });
}