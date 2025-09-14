import { WebhookConfig } from "../../types/webhooks";
import frontendCommunicator from "../common/frontend-communicator";
import JsonDbManager from "../database/json-db-manager";
import { crowbarRelayWebSocket } from "../crowbar-relay/crowbar-relay-websocket";
import eventManager from "../events/EventManager";
import { SettingsManager } from "../common/settings-manager";
import { maskPII } from "../utils";
import logger from "../logwrapper";

class WebhookConfigManager extends JsonDbManager<WebhookConfig, { "webhook-received": (data: { config: WebhookConfig; payload: unknown; }) => void }> {
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

            const data = msg.data as { webhookId: string; payload: unknown; };

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

            this.emit("webhook-received", { config: webhookConfig, payload });

            eventManager.triggerEvent("firebot", "webhook-received", {
                webhookId: webhookConfig.id,
                webhookName: webhookConfig.name,
                webhookPayload: payload
            });

        });
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
