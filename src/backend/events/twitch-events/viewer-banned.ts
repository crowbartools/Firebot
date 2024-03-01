import eventManager from "../EventManager";

export function triggerBanned(
    username: string,
    userId: string,
    userDisplayName: string,
    moderatorUsername: string,
    moderatorId: string,
    moderatorDisplayName: string,
    modReason: string
): void {
    eventManager.triggerEvent("twitch", "banned", {
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
    eventManager.triggerEvent("twitch", "unbanned", {
        username,
        userId,
        userDisplayName,
        moderatorUsername,
        moderatorId,
        moderatorDisplayName,
        moderator: moderatorDisplayName
    });
}