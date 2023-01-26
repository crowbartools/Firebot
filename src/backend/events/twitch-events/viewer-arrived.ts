import eventManager from "../../events/EventManager";

export function triggerViewerArrived(
    username: string,
    messageText: string
) {
    eventManager.triggerEvent("twitch", "viewer-arrived", {
        username,
        messageText
    });
}