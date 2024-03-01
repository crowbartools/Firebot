import eventManager from "../../events/EventManager";

export function triggerFollow(
    username: string,
    userId: string,
    userDisplayName: string
): void {
    eventManager.triggerEvent("twitch", "follow", {
        username,
        userId,
        userDisplayName
    });
}