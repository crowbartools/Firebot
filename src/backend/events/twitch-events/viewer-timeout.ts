import eventManager from "../EventManager";

export function triggerTimeout(
    userDisplayName: string,
    timeoutDuration: string | number,
    moderator: string,
    modReason: string
): void {
    eventManager.triggerEvent("twitch", "timeout", {
        username: userDisplayName,
        timeoutDuration,
        moderator,
        modReason
    });
}