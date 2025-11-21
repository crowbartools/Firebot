import { EventManager } from "../../../events/event-manager";

export function triggerBanned(
    username: string,
    userId: string,
    userDisplayName: string,
    moderatorUsername: string,
    moderatorId: string,
    moderatorDisplayName: string,
    modReason: string
): void {
    void EventManager.triggerEvent("twitch", "banned", {
        username,
        userId,
        userDisplayName,
        moderatorUsername,
        moderatorId,
        moderatorDisplayName,
        moderator: moderatorDisplayName,
        modReason
    });
}

export function triggerUnbanned(
    username: string,
    userId: string,
    userDisplayName: string,
    moderatorUsername: string,
    moderatorId: string,
    moderatorDisplayName: string
) {
    void EventManager.triggerEvent("twitch", "unbanned", {
        username,
        userId,
        userDisplayName,
        moderatorUsername,
        moderatorId,
        moderatorDisplayName,
        moderator: moderatorDisplayName
    });
}