import { EventManager } from "../../../events/event-manager";

export function triggerChatCleared(username: string, userId: string): void {
    void EventManager.triggerEvent("twitch", "chat-cleared", {
        username,
        userId
    });
}