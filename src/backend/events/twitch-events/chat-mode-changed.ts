import eventManager from "../EventManager";

export function triggerChatModeChanged(
    chatMode: string,
    chatModeState: "disabled" | "enabled",
    moderator: string,
    duration?: number
): void {
    eventManager.triggerEvent("twitch", "chat-mode-changed", {
        chatMode,
        chatModeState,
        moderator,
        duration
    });
};