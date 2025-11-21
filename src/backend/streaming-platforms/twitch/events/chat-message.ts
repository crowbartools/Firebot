import type { FirebotChatMessage } from "../../../../types/chat";
import type { CommandDefinition, UserCommand } from "../../../../types/commands";
import { EventManager } from "../../../events/event-manager";

export function triggerChatMessage(
    firebotChatMessage: FirebotChatMessage,
    triggeredCommand = false,
    command?: CommandDefinition,
    userCommand?: UserCommand
): void {
    void EventManager.triggerEvent("twitch", "chat-message", {
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
    void EventManager.triggerEvent("twitch", "chat-message-deleted", {
        username,
        userId,
        userDisplayName,
        messageText,
        messageId
    });
}

export function triggerFirstTimeChat(firebotChatMessage: FirebotChatMessage): void {
    void EventManager.triggerEvent("twitch", "first-time-chat", {
        username: firebotChatMessage.username,
        userId: firebotChatMessage.userId,
        userDisplayName: firebotChatMessage.userDisplayName,
        twitchUserRoles: firebotChatMessage.roles,
        messageText: firebotChatMessage.rawText,
        messageId: firebotChatMessage.id,
        chatMessage: firebotChatMessage
    });
}