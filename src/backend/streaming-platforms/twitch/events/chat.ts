import { EventManager } from "../../../events/event-manager";

export function triggerChatCleared(username: string, userId: string): void {
    void EventManager.triggerEvent("twitch", "chat-cleared", {
        username,
        userId
    });
}

export function triggerSharedChatEnabled() {
    void EventManager.triggerEvent("twitch", "shared-chat-started", {});
}

export function triggerSharedChatUpdated() {
    void EventManager.triggerEvent("twitch", "shared-chat-updated", {});
}

export function triggerSharedChatEnded() {
    void EventManager.triggerEvent("twitch", "shared-chat-ended", {});
}