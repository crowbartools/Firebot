import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import { encode } from "he";

import type {
    DashboardChatFeedItem,
    DashboardChatFeedMessageItem,
    DashboardChatFeedPowerUpData,
    DashboardChatFeedRewardData,
    DashboardChatMessageData,
    FirebotChatMessage,
    FirebotChatMessagePart,
    FirebotParsedMessagePart,
    OverlayWidgetConfig
} from "../../types";
import type { ChatWidgetSettings, ChatWidgetState } from "../overlay-widgets/builtin-types/chat/chat";
import type { AdvancedChatWidgetSettings } from "../overlay-widgets/builtin-types/chat/chat-advanced";

import { AccountAccess } from "../common/account-access";
import { ActiveUserHandler } from "./active-user-handler";
import { SettingsManager } from "../common/settings-manager";
import overlayWidgetsManager from "../overlay-widgets/overlay-widgets-manager";
import overlayWidgetConfigManager from "../overlay-widgets/overlay-widget-config-manager";
import frontendCommunicator from "../common/frontend-communicator";
import { LoggerCache } from "../logger-cache";

class FrontendChatManager {
    private _logger = LoggerCache.getLogger("Chat");

    private _chatFeedCache: DashboardChatFeedItem[] = [];
    private _chatFeedCacheLimit: 150;
    private _pendingOverlayMessageCache: Record<string, string[]> = { };

    constructor() {
        frontendCommunicator.onAsync("chat:ui-service-ready",
            async () => this.triggerUiRefresh()
        );
    }

    private addNewChatFeedItem(item: DashboardChatFeedItem): void {
        this._chatFeedCache.push(item);

        if (this._chatFeedCache.length > this._chatFeedCacheLimit) {
            this._chatFeedCache.shift();
        }

        frontendCommunicator.send("chat:new-chat-feed-item", item);
    }

    private sendUpdatedFeedItemToDashboard(item: DashboardChatFeedItem): void {
        frontendCommunicator.send("chat:chat-feed-item-updated", item);
    }

    sendAlertToDashboard(message: string, icon?: string): void {
        this.addNewChatFeedItem({
            id: randomUUID(),
            type: "alert",
            message: message,
            icon: !!icon?.length ? icon : "fad fa-exclamation-circle"
        });
    }

    sendRewardRedemptionToDashboard(redemption: DashboardChatFeedRewardData): void {
        if (this._chatFeedCache.length > 0) {
            const lastFeedItem = this._chatFeedCache.at(-1);

            if (lastFeedItem.type === "message"
                && !lastFeedItem.rewardMatched
                && lastFeedItem.data.customRewardId != null
                && lastFeedItem.data.customRewardId === redemption.reward.id
                && lastFeedItem.data.userId === redemption.user.id
            ) {
                lastFeedItem.rewardMatched = true;
                lastFeedItem.data.reward = redemption.reward;
                this.sendUpdatedFeedItemToDashboard(lastFeedItem);
                return;
            }
        }

        this.addNewChatFeedItem({
            id: randomUUID(),
            type: "reward-redemption",
            data: redemption
        });
    }

    sendPowerUpRedemptionToDashboard(redemption: DashboardChatFeedPowerUpData): void {
        if (this._chatFeedCache.length > 0) {
            const lastFeedItem = this._chatFeedCache.at(-1);
            if (lastFeedItem.type === "message"
                && !lastFeedItem.powerUpMatched
                // not sure if customRewardId is the right field to be checking against here until we have access to the feature
                && lastFeedItem.data.customRewardId != null
                && lastFeedItem.data.customRewardId === redemption.powerUp.id
                && lastFeedItem.data.userId === redemption.user.id
            ) {
                lastFeedItem.powerUpMatched = true;
                lastFeedItem.data.powerUp = redemption.powerUp;
                this.sendUpdatedFeedItemToDashboard(lastFeedItem);
                return;
            }
        }

        this.addNewChatFeedItem({
            id: randomUUID(),
            type: "power-up-redemption",
            data: redemption
        });
    }

    private sendChatMessageToDashboard(chatMessage: FirebotChatMessage): void {
        if (chatMessage.isAutoModHeld === true) {
            // Automatically mark as expired after 5 minutes
            setTimeout(() => this.expireAutomodForChatMessage(chatMessage.id), 5 * 60 * 1000);
        }

        ActiveUserHandler.updateOnlineViewerRoles(chatMessage.userId, chatMessage.roles);

        chatMessage.timestampDisplay = DateTime.fromMillis(chatMessage.timestamp)
            .toFormat("h:mm a");

        chatMessage.profilePicUrl ??= "../images/placeholders/default-profile-pic.png";

        const existingAutoModMessageIndex = this._chatFeedCache.findIndex(i =>
            i.type === "message"
            && i.data.isAutoModHeld
            && i.data.autoModHeldMessageId == null
            && i.data.rawText === chatMessage.rawText
            && i.data.userId === chatMessage.userId
            && DateTime.now().diff(DateTime.fromMillis(i.data.timestamp), "minutes").minutes <= 5
        );

        let chatMessageData: DashboardChatMessageData = {
            ...chatMessage
        };

        if (existingAutoModMessageIndex > -1) {
            const existingAutoModMessage = (this._chatFeedCache[existingAutoModMessageIndex] as DashboardChatFeedMessageItem)?.data;

            if (existingAutoModMessage != null) {
                // Merge the new message with the existing one
                chatMessageData = {
                    ...existingAutoModMessage,
                    ...chatMessage,
                    autoModHeldMessageId: existingAutoModMessage.id,
                    isAutoModHeld: existingAutoModMessage.isAutoModHeld,
                    autoModStatus: existingAutoModMessage.autoModStatus,
                    autoModResolvedBy: existingAutoModMessage.autoModResolvedBy,
                    autoModErrorMessage: existingAutoModMessage.autoModErrorMessage
                };

                // Remove the existing automod message from the queue
                this._chatFeedCache.splice(existingAutoModMessageIndex, 1);
                this.triggerUiRefresh();
            }
        }

        const newItem: DashboardChatFeedMessageItem = {
            id: chatMessage.id,
            type: "message",
            data: chatMessageData
        };

        if (chatMessage.customRewardId != null && this._chatFeedCache.length > 0) {
            // Check if this follows a reward redemption
            const lastFeedItem = this._chatFeedCache.at(-1);
            if (((
                lastFeedItem.type === "reward-redemption" && lastFeedItem.data.reward.id === chatMessage.customRewardId
            ) || (
                lastFeedItem.type === "power-up-redemption" && lastFeedItem.data.powerUp.id === chatMessage.customRewardId
            ))
                && lastFeedItem.data.user.id === chatMessage.userId
            ) {
                newItem.rewardMatched = true;
            }
        }

        this.addNewChatFeedItem(newItem);
    }

    private sendChatMessageToChatWidget(
        chatWidget: OverlayWidgetConfig<ChatWidgetSettings | AdvancedChatWidgetSettings, ChatWidgetState>,
        chatMessage: FirebotChatMessage,
        delayed = false
    ): void {
        if (delayed === true) {
            if ((this._pendingOverlayMessageCache[chatWidget.id] ?? []).some(m => m === chatMessage.id)) {
                // Remove it from the pending list so we know we've taken care of it
                this._pendingOverlayMessageCache[chatWidget.id] = this._pendingOverlayMessageCache[chatWidget.id]
                    .filter(m => m !== chatMessage.id);
            } else {
                this._logger.info(`Chat message ${chatMessage.id} not in pending cache for widget ${chatWidget.id}; ignoring`);
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
                this.deleteChatMessageFromChatWidget(chatWidget, chatMessage.id, true);
            }, messageTimeout * 1000);
        }
    }

    sendChatMessageToFrontend(chatMessage: FirebotChatMessage): void {
        chatMessage.timestamp = new Date().getTime();

        this.sendChatMessageToDashboard(chatMessage);

        if (chatMessage.whisper === true
            || chatMessage.isAutoModHeld === true
            || chatMessage.autoModStatus === "denied"
            || chatMessage.autoModStatus === "expired"
        ) {
            return;
        }

        const chatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<ChatWidgetSettings, ChatWidgetState>>("firebot:chat");
        const advancedChatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<AdvancedChatWidgetSettings, ChatWidgetState>>("firebot:chat-advanced");

        for (const chatWidget of [...chatWidgets, ...advancedChatWidgets]) {
            if (!!chatWidget.active) {
                if (chatWidget.settings.delayMessages === true && chatWidget.settings.messageDelay) {
                    this._pendingOverlayMessageCache[chatWidget.id] ??= [];

                    this._pendingOverlayMessageCache[chatWidget.id].push(chatMessage.id);

                    setTimeout(() => {
                        this.sendChatMessageToChatWidget(chatWidget, chatMessage, true);
                    }, chatWidget.settings.messageDelay * 1000);
                } else {
                    this.sendChatMessageToChatWidget(chatWidget, chatMessage);
                }
            }
        }
    }

    private deleteChatMessageFromDashboard(messageId: string): void {
        const chatMessage = this._chatFeedCache.find(i => i.type === "message" && i.id === messageId) as DashboardChatFeedMessageItem;

        if (chatMessage != null) {
            chatMessage.data.deleted = true;
        }

        this.sendUpdatedFeedItemToDashboard(chatMessage);
    }

    private deleteChatMessageFromChatWidget(
        chatWidget: OverlayWidgetConfig<ChatWidgetSettings | AdvancedChatWidgetSettings, ChatWidgetState>,
        messageId: string,
        animate = false
    ): void {
        this._pendingOverlayMessageCache[chatWidget.id] = (this._pendingOverlayMessageCache[chatWidget.id] ?? [])
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

    deleteChatMessageFromFrontend(messageId: string, animate = false): void {
        this.deleteChatMessageFromDashboard(messageId);

        const chatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<ChatWidgetSettings, ChatWidgetState>>("firebot:chat");
        const advancedChatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<AdvancedChatWidgetSettings, ChatWidgetState>>("firebot:chat-advanced");

        for (const chatWidget of [...chatWidgets, ...advancedChatWidgets]) {
            this.deleteChatMessageFromChatWidget(chatWidget, messageId, animate);
        }
    }

    private deleteUserMessagesFromDashboard(username: string): void {
        const userMessages = this._chatFeedCache.filter(i => i.type === "message" && i.data.username.toLowerCase() === username) as DashboardChatFeedMessageItem[];

        for (const message of userMessages) {
            message.data.deleted = true;
        }

        frontendCommunicator.send("chat:chat-feed-items-updated", userMessages);
    }

    deleteUserMessagesFromFrontend(username: string): void {
        this.deleteUserMessagesFromDashboard(username);

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

    private clearDashboardChatFeed(moderatorUsername: string): void {
        const clearMode = SettingsManager.getSetting("ClearChatFeedMode");

        const isStreamer = AccountAccess.getAccounts().streamer.username.toLowerCase()
            === moderatorUsername.toLowerCase();

        if (clearMode !== "never" && (clearMode === "always" || isStreamer)) {
            this._chatFeedCache = [];
            this.triggerUiRefresh();
        }

        this.sendAlertToDashboard(`${moderatorUsername} cleared the chat.`);
    }

    clearChatFeed(moderatorUsername: string): void {
        this.clearDashboardChatFeed(moderatorUsername);

        const chatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<ChatWidgetSettings, ChatWidgetState>>("firebot:chat");
        const advancedChatWidgets = overlayWidgetConfigManager.getConfigsOfType<OverlayWidgetConfig<AdvancedChatWidgetSettings, ChatWidgetState>>("firebot:chat-advanced");

        for (const chatWidget of [...chatWidgets, ...advancedChatWidgets]) {
            overlayWidgetConfigManager.setWidgetStateById<ChatWidgetState>(chatWidget.id, {
                chatMessages: null
            });
        }
    }

    private expireAutomodForChatMessage(messageId: string) {
        const chatMessage = this._chatFeedCache.find(i => i.type === "message" && i.id === messageId) as DashboardChatFeedMessageItem;

        if (chatMessage?.data.autoModStatus === "pending") {
            chatMessage.data.autoModStatus = "expired";
            this.sendUpdatedFeedItemToDashboard(chatMessage);
        }
    }

    updateChatMessageAutomodStatus(
        messageId: string,
        newStatus: FirebotChatMessage["autoModStatus"],
        resolverName: string
    ): void {
        const chatMessage = this._chatFeedCache.find(i =>
            i.type === "message"
            && (i.id === messageId || i.data.autoModHeldMessageId === messageId)
        ) as DashboardChatFeedMessageItem;

        if (chatMessage != null) {
            chatMessage.data.autoModStatus = newStatus;
            chatMessage.data.autoModResolvedBy = resolverName;
            this.sendUpdatedFeedItemToDashboard(chatMessage);
        }
    }

    setChatMessageAutomodError(messageId: string, likelyExpired: boolean): void {
        const chatMessage = this._chatFeedCache.find(i =>
            i.type === "message"
            && (i.id === messageId || i.data.autoModHeldMessageId === messageId)
        ) as DashboardChatFeedMessageItem;

        if (chatMessage != null) {
            chatMessage.data.autoModErrorMessage = `There was an error acting on this message. ${likelyExpired ? "The time to act has likely expired." : "You may need to reauth your Streamer account."}`;
            this.sendUpdatedFeedItemToDashboard(chatMessage);
        }
    }

    addCustomHighlightToDashboardChatMessage(highlightData: {
        messageId: string;
        customHighlightColor: string;
        customBannerIcon: string;
        customBannerText: string;
    }): void {
        const chatMessage = this._chatFeedCache.find(i => i.type === "message" && i.id === highlightData.messageId) as DashboardChatFeedMessageItem;

        if (chatMessage != null) {
            chatMessage.data.customHighlightColor = highlightData.customHighlightColor;
            chatMessage.data.customBannerIcon = highlightData.customBannerIcon;
            chatMessage.data.customBannerText = highlightData.customBannerText;
            this.sendUpdatedFeedItemToDashboard(chatMessage);
        }
    }

    hideChatMessageFromDashboard(messageId: string): void {
        const chatMessage = this._chatFeedCache.find(i => i.type === "message" && i.id === messageId) as DashboardChatFeedMessageItem;

        if (chatMessage != null) {
            chatMessage.data.isHiddenFromChatFeed = true;
            this.sendUpdatedFeedItemToDashboard(chatMessage);
        }
    }

    triggerUiRefresh(): void {
        this._logger.debug("Triggering chat feed UI refresh");
        frontendCommunicator.send("chat:all-chat-feed-items", this._chatFeedCache);
    }
}

const manager = new FrontendChatManager();

export { manager as FrontendChatManager };