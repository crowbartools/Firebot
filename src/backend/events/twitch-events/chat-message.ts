import { ClearMsg } from "@twurple/chat";
import { FirebotChatMessage } from "../../../types/chat";
import eventManager from "../../events/EventManager";

export function triggerChatMessage(firebotChatMessage: FirebotChatMessage): void {
    eventManager.triggerEvent("twitch", "chat-message", {
        username: firebotChatMessage.username,
        userId: firebotChatMessage.userId,
        userDisplayName: firebotChatMessage.userDisplayName,
        twitchUserRoles: firebotChatMessage.roles,
        messageText: firebotChatMessage.rawText,
        messageId: firebotChatMessage.id,
        chatMessage: firebotChatMessage
    });
}

export function triggerChatMessageDeleted(deletedChatMessage: ClearMsg): void {
    eventManager.triggerEvent("twitch", "chat-message-deleted", {
        username: deletedChatMessage.userName,
        messageText: deletedChatMessage.text,
        messageId: deletedChatMessage.targetMessageId,
        deletedChatMessage: {
            text: deletedChatMessage.text,
            userName: deletedChatMessage.userName,
            channelId: deletedChatMessage.channelId,
            targetMessageId: deletedChatMessage.targetMessageId,
            paramCount: deletedChatMessage.paramCount,
            prefix: deletedChatMessage.prefix,
            command: deletedChatMessage.command,
            tags: deletedChatMessage.tags,
            rawLine: deletedChatMessage.rawLine
        }
    });
}

export function triggerFirstTimeChat(firebotChatMessage: FirebotChatMessage): void {
    eventManager.triggerEvent("twitch", "first-time-chat", {
        username: firebotChatMessage.username,
        userId: firebotChatMessage.userId,
        userDisplayName: firebotChatMessage.userDisplayName,
        twitchUserRoles: firebotChatMessage.roles,
        messageText: firebotChatMessage.rawText,
        messageId: firebotChatMessage.id,
        chatMessage: firebotChatMessage
    });
}