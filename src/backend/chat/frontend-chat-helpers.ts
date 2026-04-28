import type { FirebotChatMessage } from "../../types";
import overlayWidgetsManager from "../overlay-widgets/overlay-widgets-manager";
import overlayWidgetConfigManager from "../overlay-widgets/overlay-widget-config-manager";
import frontendCommunicator from "../common/frontend-communicator";

class FirebotFrontendChatHelpers {
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

        const chatWidgets = overlayWidgetConfigManager.getConfigsOfType("firebot:chat");

        for (const chatWidget of chatWidgets) {
            const existingChatMessages = (chatWidget.state?.chatMessages ?? []) as FirebotChatMessage[];
            overlayWidgetConfigManager.setWidgetStateById(chatWidget.id, {
                chatMessages: [...existingChatMessages.slice(-49), chatMessage]
            });

            void overlayWidgetsManager.sendWidgetEventToOverlay(
                "message",
                chatWidget,
                {
                    messageName: "chat-message",
                    messageData: {
                        chatMessage
                    }
                }
            );
        }
    }

    deleteMessageFromFrontend(messageId: string): void {
        frontendCommunicator.send("twitch:chat:message:deleted", messageId);

        const chatWidgets = overlayWidgetConfigManager.getConfigsOfType("firebot:chat");
        for (const chatWidget of chatWidgets) {
            const chatMessages = ((chatWidget.state?.chatMessages ?? []) as FirebotChatMessage[])
                .filter(m => m.id !== messageId);

            overlayWidgetConfigManager.setWidgetStateById(chatWidget.id, {
                chatMessages: chatMessages
            });

            void overlayWidgetsManager.sendWidgetEventToOverlay(
                "message",
                chatWidget,
                {
                    messageName: "delete-message",
                    messageData: {
                        messageId
                    }
                }
            );
        }
    }

    deleteUserMessagesFromFrontend(username: string) {
        frontendCommunicator.send("twitch:chat:user:delete-messages", username);

        const chatWidgets = overlayWidgetConfigManager.getConfigsOfType("firebot:chat");
        for (const chatWidget of chatWidgets) {
            const chatMessages = ((chatWidget.state?.chatMessages ?? []) as FirebotChatMessage[])
                .filter(m => m.username !== username);

            overlayWidgetConfigManager.setWidgetStateById(chatWidget.id, {
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

        const chatWidgets = overlayWidgetConfigManager.getConfigsOfType("firebot:chat");
        for (const chatWidget of chatWidgets) {
            overlayWidgetConfigManager.setWidgetStateById(chatWidget.id, {
                chatMessages: []
            });

            void overlayWidgetsManager.sendWidgetEventToOverlay(
                "message",
                chatWidget,
                {
                    messageName: "clear-chat"
                }
            );
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