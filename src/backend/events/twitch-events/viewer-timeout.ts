import eventManager from "../EventManager";

export function triggerTimeout(
    username: string,
    timeoutDuration: string | number,
    moderator: string,
    modReason: string
): void {
    eventManager.triggerEvent("twitch", "timeout", {
        username,
        timeoutDuration,
        moderator,
        modReason
    });
};