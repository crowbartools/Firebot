import eventManager from "../../events/EventManager";

export function triggerChatCleared(username: string, userId: string): void {
    eventManager.triggerEvent("twitch", "chat-cleared", {
        username,
        userId
    });
}