import { EventManager } from "../../../events/event-manager";

export function triggerFollow(
    username: string,
    userId: string,
    userDisplayName: string
): void {
    void EventManager.triggerEvent("twitch", "follow", {
        username,
        userId,
        userDisplayName
    });
}