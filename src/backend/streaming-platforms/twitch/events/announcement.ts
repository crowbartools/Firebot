import { EventManager } from "../../../events/event-manager";

export function triggerAnnouncement(
    username: string,
    userId: string,
    userDisplayName: string,
    twitchUserRoles: string[],
    messageText: string,
    messageId: string
): void {
    void EventManager.triggerEvent("twitch", "announcement", {
        username,
        userId,
        userDisplayName,
        twitchUserRoles,
        messageText,
        messageId
    });
}