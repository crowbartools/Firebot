import eventManager from "../EventManager";

export function triggerBanned(
    username: string,
    moderator: string,
    modReason: string
): void {
    eventManager.triggerEvent("twitch", "banned", {
        username,
        moderator,
        modReason
    });
};