import eventManager from "../EventManager";

export function triggerBanned(
    userDisplayName: string,
    moderator: string,
    modReason: string
): void {
    eventManager.triggerEvent("twitch", "banned", {
        username: userDisplayName,
        moderator,
        modReason
    });
};
