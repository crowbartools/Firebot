import eventManager from "../../events/EventManager";

export function triggerSub(
    userName: string,
    userId: string,
    userDisplayName: string,
    subPlan: string,
    totalMonths: number,
    subMessage: string,
    streak: number,
    isPrime: boolean,
    isResub: boolean
): void {
    eventManager.triggerEvent("twitch", "sub", {
        userIdName: userName,
        username: userDisplayName,
        userId,
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
    userDisplayName: string,
    userId: string,
    subPlan: string
 ): void {
    eventManager.triggerEvent("twitch", "prime-sub-upgraded", {
        username: userDisplayName,
        userIdName: username,
        userId,
        subPlan
    });
}