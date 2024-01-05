import { FirebotChatMessage } from "../../../types/chat";
import eventManager from "../../events/EventManager";

export function triggerChatMessage(firebotChatMessage: FirebotChatMessage): void {
    eventManager.triggerEvent("twitch", "chat-message", {
        userId: firebotChatMessage.userId,
        userIdName: firebotChatMessage.userIdName,
        username: firebotChatMessage.username,
        twitchUserRoles: firebotChatMessage.roles,
        messageText: firebotChatMessage.rawText,
        chatMessage: firebotChatMessage
    });
}

export function triggerFirstTimeChat(firebotChatMessage: FirebotChatMessage): void {
    eventManager.triggerEvent("twitch", "first-time-chat", {
        userId: firebotChatMessage.userId,
        userIdName: firebotChatMessage.userIdName,
        username: firebotChatMessage.username,
        twitchUserRoles: firebotChatMessage.roles,
        messageText: firebotChatMessage.rawText,
        chatMessage: firebotChatMessage
    });
}