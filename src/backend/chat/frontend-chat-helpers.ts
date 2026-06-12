import { encode } from "he";
import type {
    FirebotChatMessage,
    FirebotChatMessagePart,
    FirebotParsedMessagePart,
    OverlayWidgetConfig
} from "../../types";
import type { ChatWidgetSettings, ChatWidgetState } from "../overlay-widgets/builtin-types/chat/chat";
import type { AdvancedChatWidgetSettings } from "../overlay-widgets/builtin-types/chat/chat-advanced";
import overlayWidgetsManager from "../overlay-widgets/overlay-widgets-manager";
import overlayWidgetConfigManager from "../overlay-widgets/overlay-widget-config-manager";
import frontendCommunicator from "../common/frontend-communicator";
import { LoggerCache } from "../logger-cache";

class FirebotFrontendChatHelpers {
    private logger = LoggerCache.getLogger("Chat");

    private _pendingMessageCache: Record<string, string[]> = { };

    private sendChatMessageToChatWidget(
        chatWidget: OverlayWidgetConfig<ChatWidgetSettings | AdvancedChatWidgetSettings, ChatWidgetState>,
        chatMessage: FirebotChatMessage,
        delayed = false
    ): void {
        if (delayed === true) {
            if ((this._pendingMessageCache[chatWidget.id] ?? []).some(m => m === chatMessage.id)) {
                // Remove it from the pending list so we know we've taken care of it
                this._pendingMessageCache[chatWidget.id] = this._pendingMessageCache[chatWidget.id]
                    .filter(m => m !== chatMessage.id);
            } else {
                this.logger.info(`Chat message ${chatMessage.id} not in pending cache for widget ${chatWidget.id}; ignoring`);
                return;
            }
        }

        const frontendChatMessage = {
            ...chatMessage
        };

        frontendChatMessage.parts = chatMessage.parts.map((p: FirebotParsedMessagePart | FirebotChatMessagePart) => {
            const part = { ...p };

            if (part.type === "text" || part.type === "link") {
                part.text = encode(part.text);
            }

            return part;
        });

        const existingChatMessages = chatWidget.state?.chatMessages ?? [];
        overlayWidgetConfigManager.setWidgetStateById<ChatWidgetState>(chatWidget.id, {
            chatMessages: [...existingChatMessages.slice(-99), frontendChatMessage]
        });

        void overlayWidgetsManager.sendWidgetEventToOverlay(
            "message",
            chatWidget,
            {
                messageName: "chat-message",
                messageData: {
                    chatMessage: frontendChatMessage
                }
            }
        );

        const messageTimeout = chatWidget.settings.messageTimeout;
        if (chatWidget.settings.autoRemoveMessages === true && messageTimeout != null && messageTimeout > 0) {
            setTimeout(() => {
                this.deleteMessageFromChatWidget(chatWidget, chatMessage.id, true);
            }, messageTimeout * 1000);
        }
    }

    sendChatMessageToFrontend(chatMessage: FirebotChatMessage): void {
        frontendCommunicator.send("twitch:chat:message", chatMessage);

        if (chatMessage.whisper === true
            || chatMessage.isAutoModHeld === true
            || chatMessage.autoModStatus === "denied"
            || chatMessage.autoModStatus === "expired"
        ) {
            return;
        }

        chatMessage.timestamp = new Date().getTime();

        const chatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<ChatWidgetSettings, ChatWidgetState>>("firebot:chat");
        const advancedChatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<AdvancedChatWidgetSettings, ChatWidgetState>>("firebot:chat-advanced");

        for (const chatWidget of [...chatWidgets, ...advancedChatWidgets]) {
            if (!!chatWidget.active) {
                if (chatWidget.settings.delayMessages === true && chatWidget.settings.messageDelay) {
                    this._pendingMessageCache[chatWidget.id] ??= [];

                    this._pendingMessageCache[chatWidget.id].push(chatMessage.id);

                    setTimeout(() => {
                        this.sendChatMessageToChatWidget(chatWidget, chatMessage, true);
                    }, chatWidget.settings.messageDelay * 1000);
                } else {
                    this.sendChatMessageToChatWidget(chatWidget, chatMessage);
                }
            }
        }
    }

    private deleteMessageFromChatWidget(
        chatWidget: OverlayWidgetConfig<ChatWidgetSettings | AdvancedChatWidgetSettings, ChatWidgetState>,
        messageId: string,
        animate = false
    ): void {
        this._pendingMessageCache[chatWidget.id] = (this._pendingMessageCache[chatWidget.id] ?? [])
            .filter(m => m !== messageId) ?? [];

        const chatMessages = (chatWidget.state?.chatMessages ?? [])
            .filter(m => m.id !== messageId);

        overlayWidgetConfigManager.setWidgetStateById<ChatWidgetState>(chatWidget.id, {
            chatMessages: chatMessages
        });

        void overlayWidgetsManager.sendWidgetEventToOverlay(
            "message",
            chatWidget,
            {
                messageName: "delete-message",
                messageData: {
                    messageId,
                    animate
                }
            }
        );
    }

    deleteMessageFromFrontend(messageId: string, animate = false): void {
        frontendCommunicator.send("twitch:chat:message:deleted", messageId);

        const chatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<ChatWidgetSettings, ChatWidgetState>>("firebot:chat");
        const advancedChatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<AdvancedChatWidgetSettings, ChatWidgetState>>("firebot:chat-advanced");

        for (const chatWidget of [...chatWidgets, ...advancedChatWidgets]) {
            this.deleteMessageFromChatWidget(chatWidget, messageId, animate);
        }
    }

    deleteUserMessagesFromFrontend(username: string) {
        frontendCommunicator.send("twitch:chat:user:delete-messages", username);

        const chatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<ChatWidgetSettings, ChatWidgetState>>("firebot:chat");
        const advancedChatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<AdvancedChatWidgetSettings, ChatWidgetState>>("firebot:chat-advanced");

        for (const chatWidget of [...chatWidgets, ...advancedChatWidgets]) {
            const chatMessages = (chatWidget.state?.chatMessages ?? [])
                .filter(m => m.username !== username);

            overlayWidgetConfigManager.setWidgetStateById<ChatWidgetState>(chatWidget.id, {
                chatMessages: chatMessages
            });

            void overlayWidgetsManager.sendWidgetEventToOverlay(
                "message",
                chatWidget,
                {
                    messageName: "delete-user-messages",
                    messageData: {
                        username
                    }
                }
            );
        }
    }

    clearChatFeed(moderatorName: string): void {
        frontendCommunicator.send("twitch:chat:clear-feed", moderatorName);

        const chatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<ChatWidgetSettings, ChatWidgetState>>("firebot:chat");
        const advancedChatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<AdvancedChatWidgetSettings, ChatWidgetState>>("firebot:chat-advanced");

        for (const chatWidget of [...chatWidgets, ...advancedChatWidgets]) {
            overlayWidgetConfigManager.setWidgetStateById<ChatWidgetState>(chatWidget.id, {
                chatMessages: null
            });
        }
    }

    updateMessageAutomodStatus(
        messageId: string,
        newStatus: FirebotChatMessage["autoModStatus"],
        resolverName: string,
        resolverId: string,
        flaggedPhrases: string[]
    ): void {
        frontendCommunicator.send("twitch:chat:automod-update", {
            messageId,
            newStatus,
            resolverName,
            resolverId,
            flaggedPhrases
        });
    }
}

const frontendChatHelpers = new FirebotFrontendChatHelpers();

export { frontendChatHelpers as FirebotFrontendChatHelpers };