import eventManager from "../../events/EventManager";

export function triggerSub(
    userName: string,
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
        subPlan,
        totalMonths,
        subMessage,
        streak,
        isPrime,
        isResub
    });
};

export function triggerPrimeUpgrade(
    userDisplayName: string,
    subPlan: string
 ): void {
    eventManager.triggerEvent("twitch", "prime-sub-upgraded", {
        username: userDisplayName,
        subPlan
    });
};