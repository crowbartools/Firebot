import { FirebotChatMessage } from "../../../types/chat";
import eventManager from "../../events/EventManager";

export function triggerViewerArrived(
    userDisplayName: string,
    userName: string,
    userId: string,
    messageText: string,
    chatMessage: FirebotChatMessage
) {
    eventManager.triggerEvent("twitch", "viewer-arrived", {
        username: userDisplayName,
        userIdName: userName,
        userId,
        messageText,
        chatMessage
    });
}