import { FirebotChatMessage } from "../../chat/chat-helpers";
import eventManager from "../../events/EventManager";

export function triggerChatMessage(firebotChatMessage: FirebotChatMessage): void {
    eventManager.triggerEvent("twitch", "chat-message", {
        userIdName: firebotChatMessage.useridname,
        username: firebotChatMessage.username,
        twitchUserRoles: firebotChatMessage.roles,
        messageText: firebotChatMessage.rawText,
        chatMessage: firebotChatMessage
    });
};