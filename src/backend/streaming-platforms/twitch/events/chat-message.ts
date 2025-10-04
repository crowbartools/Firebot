import { FirebotChatMessage } from "../../../../types/chat";
import { CommandDefinition, UserCommand } from "../../../../types/commands";
import eventManager from "../../../events/EventManager";

export function triggerChatMessage(
    firebotChatMessage: FirebotChatMessage,
    triggeredCommand = false,
    command?: CommandDefinition,
    userCommand?: UserCommand
): void {
    eventManager.triggerEvent("twitch", "chat-message", {
        username: firebotChatMessage.username,
        userId: firebotChatMessage.userId,
        userDisplayName: firebotChatMessage.userDisplayName,
        twitchUserRoles: firebotChatMessage.roles,
        messageText: firebotChatMessage.rawText,
        messageId: firebotChatMessage.id,
        chatMessage: firebotChatMessage,
        triggeredCommand,
        command,
        userCommand
    });
}

export function triggerChatMessageDeleted(
    username: string,
    userId: string,
    userDisplayName: string,
    messageText: string,
    messageId: string
): void {
    eventManager.triggerEvent("twitch", "chat-message-deleted", {
        username,
        userId,
        userDisplayName,
        messageText,
        messageId
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