import eventManager from "../../events/EventManager";

export function triggerShoutoutSent(
    username: string,
    userId: string,
    userDisplayName: string,
    moderatorUsername: string,
    moderatorId: string,
    moderatorDisplayName: string,
    viewerCount: number
) {
    eventManager.triggerEvent("twitch", "shoutout-sent", {
        username,
        userId,
        userDisplayName,
        moderatorUsername,
        moderatorId,
        moderatorDisplayName,
        moderator: moderatorDisplayName,
        viewerCount
    });
}

export function triggerShoutoutReceived(
    username: string,
    userId: string,
    userDisplayName: string,
    viewerCount: number
) {
    eventManager.triggerEvent("twitch", "shoutout-received", {
        username,
        userId,
        userDisplayName,
        viewerCount
    });
}