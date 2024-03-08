import eventManager from "../../events/EventManager";

export function triggerRaid(
    username: string,
    userId: string,
    userDisplayName: string,
    viewerCount = 0
): void {
    eventManager.triggerEvent("twitch", "raid", {
        username,
        userId,
        userDisplayName,
        viewerCount
    });
}