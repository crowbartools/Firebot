import eventManager from "../../events/EventManager";

export function triggerFollow(
    userId: string,
    userName: string,
    userDisplayName: string
): void {
    eventManager.triggerEvent("twitch", "follow", {
        userId,
        userIdName: userName,
        username: userDisplayName
    });
}