import eventManager from "../../events/EventManager";

export function triggerViewerArrived(
    userDisplayName: string,
    messageText: string
) {
    eventManager.triggerEvent("twitch", "viewer-arrived", {
        username: userDisplayName,
        messageText
    });
}
