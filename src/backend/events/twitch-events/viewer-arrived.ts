import eventManager from "../../events/EventManager";

export function triggerViewerArrived(
    userDisplayName: string,
    userName: string,
    userId: string,
    messageText: string
) {
    eventManager.triggerEvent("twitch", "viewer-arrived", {
        username: userDisplayName,
        userIdName: userName,
        userId,
        messageText
    });
}
