import eventManager from "../EventManager";

export function triggerAnnouncement(
    username: string,
    userId: string,
    userDisplayName: string,
    twitchUserRoles: string[],
    messageText: string
): void {
    eventManager.triggerEvent("twitch", "announcement", {
        username,
        userId,
        userDisplayName,
        twitchUserRoles,
        messageText
    });
}