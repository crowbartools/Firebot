import eventManager from "../../events/EventManager";

export function triggerRaid(
    userDisplayName: string,
    viewerCount: number = 0
): void {
    eventManager.triggerEvent("twitch", "raid", {
        username: userDisplayName,
        viewerCount
    });
};