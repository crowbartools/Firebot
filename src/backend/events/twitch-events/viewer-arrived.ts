import { FirebotChatMessage } from "../../../types/chat";
import eventManager from "../../events/EventManager";

export function triggerViewerArrived(
    username: string,
    userId: string,
    userDisplayName: string,
    messageText: string,
    chatMessage: FirebotChatMessage
) {
    eventManager.triggerEvent("twitch", "viewer-arrived", {
        username,
        userId,
        userDisplayName,
        messageText,
        messageId: chatMessage.id,
        chatMessage
    });
}