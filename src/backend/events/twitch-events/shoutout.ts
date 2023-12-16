import eventManager from "../../events/EventManager";

export function triggerShoutoutSent(
    userDisplayName: string,
    moderatorDisplayName: string,
    viewerCount: number
) {
    eventManager.triggerEvent("twitch", "shoutout-sent", {
        username: userDisplayName,
        moderator: moderatorDisplayName,
        viewerCount
    });
};

export function triggerShoutoutReceived(
    userDisplayName: string,
    viewerCount: number
) {
    eventManager.triggerEvent("twitch", "shoutout-received", {
        username: userDisplayName,
        viewerCount
    });
};