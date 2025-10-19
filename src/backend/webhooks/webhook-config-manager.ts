import { WebhookConfig } from "../../types/webhooks";
import frontendCommunicator from "../common/frontend-communicator";
import JsonDbManager from "../database/json-db-manager";
import { crowbarRelayWebSocket } from "../crowbar-relay/crowbar-relay-websocket";
import { EventManager } from "../events/event-manager";
import { SettingsManager } from "../common/settings-manager";
import { maskPII } from "../utils";
import logger from "../logwrapper";
import accountAccess from "../common/account-access";

type ExtraEvents = {
    "webhook-received": (data: { config: WebhookConfig, payload: unknown, headers: Record<string, string> }) => void;
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

            const data = msg.data as { webhookId: string, payload: unknown, headers: Record<string, string> };

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
                headers: data.headers ?? {}
            });

            void EventManager.triggerEvent("firebot", "webhook-received", {
                webhookId: webhookConfig.id,
                webhookName: webhookConfig.name,
                webhookPayload: payload,
                webhookHeaders: data.headers ?? {}
            });

        });
    }

    getWebhookUrlById(webhookId: string): string {
        const streamer = accountAccess.getAccounts().streamer;
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
