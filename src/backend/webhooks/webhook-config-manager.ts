import { WebhookConfig } from "../../types/webhooks";

import JsonDbManager from "../database/json-db-manager";
import { AccountAccess } from "../common/account-access";
import { crowbarRelayWebSocket } from "../crowbar-relay/crowbar-relay-websocket";
import { EventManager } from "../events/event-manager";
import { SettingsManager } from "../common/settings-manager";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";
import { maskPII } from "../utils";

type ExtraEvents = {
    "webhook-received": (data: { 
        config: WebhookConfig,
        payload: unknown, 
        rawPayload?: string, 
        headers: Record<string, string> 
    }) => void;
};

class WebhookConfigManager extends JsonDbManager<WebhookConfig, ExtraEvents> {
    constructor() {
        super("Webhooks", "/webhooks");

        const sendWebhookIds = () => {
            crowbarRelayWebSocket.send("update-webhooks", {
                webhookIds: this.getAllItems().map(item => item.id)
            });

            frontendCommunicator.send("webhooks:updated", this.getAllItems());
        };

        this.on("items-changed", sendWebhookIds);
        crowbarRelayWebSocket.on("ready", sendWebhookIds);

        crowbarRelayWebSocket.on("message", (msg) => {
            if (msg.event !== "webhook") {
                return;
            }

            if (SettingsManager.getSetting("WebhookDebugLogs")) {
                logger.debug("Webhook received:", maskPII(msg.data));
            }

            const data = msg.data as { 
                webhookId: string, 
                payload: unknown, 
                rawPayload?: string, 
                headers: Record<string, string> 
            };

            const webhookConfig = this.getItem(data.webhookId);
            if (!webhookConfig) {
                return;
            }

            let payload = data.payload;

            if (typeof payload === "string") {
                try {
                    payload = JSON.parse(payload);
                } catch {}
            }

            this.emit("webhook-received", {
                config: webhookConfig,
                payload,
                rawPayload: data.rawPayload,
                headers: data.headers ?? {}
            });

            void EventManager.triggerEvent("firebot", "webhook-received", {
                webhookId: webhookConfig.id,
                webhookName: webhookConfig.name,
                webhookPayload: payload,
                webhookRawPayload: data.rawPayload,
                webhookHeaders: data.headers ?? {}
            });

        });
    }

    getWebhookUrlById(webhookId: string): string {
        const streamer = AccountAccess.getAccounts().streamer;
        return `https://api.crowbar.tools/v1/webhook/${streamer.channelId}/${webhookId}`;
    }
}

const webhookConfigManager = new WebhookConfigManager();

frontendCommunicator.onAsync("webhooks:get-all", async () =>
    webhookConfigManager.getAllItems()
);

frontendCommunicator.onAsync("webhooks:save", async (webhookConfig: WebhookConfig) =>
    webhookConfigManager.saveItem(webhookConfig)
);

frontendCommunicator.on("webhooks:delete", (webhookConfigId: string) =>
    webhookConfigManager.deleteItem(webhookConfigId)
);

export = webhookConfigManager;
