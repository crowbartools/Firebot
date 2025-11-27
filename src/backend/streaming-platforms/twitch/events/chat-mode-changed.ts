import { EventManager } from "../../../events/event-manager";

export function triggerChatModeChanged(
    chatMode: string,
    chatModeState: "disabled" | "enabled",
    moderator: string,
    duration?: number
): void {
    void EventManager.triggerEvent("twitch", "chat-mode-changed", {
        chatMode,
        chatModeState,
        moderator,
        duration
    });
}