import type { FirebotChatMessage } from "../../../../types/chat";
import { EventManager } from "../../../events/event-manager";

export function triggerViewerArrived(
    username: string,
    userId: string,
    userDisplayName: string,
    messageText: string,
    chatMessage: FirebotChatMessage
) {
    void EventManager.triggerEvent("twitch", "viewer-arrived", {
        username,
        userId,
        userDisplayName,
        messageText,
        messageId: chatMessage.id,
        chatMessage
    });
}