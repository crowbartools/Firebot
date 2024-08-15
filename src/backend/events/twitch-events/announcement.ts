import eventManager from "../EventManager";

export function triggerAnnouncement(
    username: string,
    userId: string,
    userDisplayName: string,
    twitchUserRoles: string[],
    messageText: string,
    messageId: string
): void {
    eventManager.triggerEvent("twitch", "announcement", {
        username,
        userId,
        userDisplayName,
        twitchUserRoles,
        messageText,
        messageId
    });
}