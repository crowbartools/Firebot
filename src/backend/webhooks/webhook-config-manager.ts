import type { PluginWebhook, PluginWebhookEventHandler, WebhookConfig } from "../../types";

import JsonDbManager from "../database/json-db-manager";
import { AccountAccess } from "../common/account-access";
import { crowbarRelayWebSocket } from "../crowbar-relay/crowbar-relay-websocket";
import { EventManager } from "../events/event-manager";
import { SettingsManager } from "../common/settings-manager";
import frontendCommunicator from "../common/frontend-communicator";
import { maskPII } from "../utils";

type ExtraEvents = {
    "webhook-received": (data: {
        config: WebhookConfig;
        payload: unknown;
        rawPayload?: string;
        headers: Record<string, string>;
    }) => void;
};

class WebhookConfigManager extends JsonDbManager<WebhookConfig, ExtraEvents> {
    private _registeredPlugins: Record<string, PluginWebhookEventHandler> = {};

    constructor() {
        super("Webhook", "/webhooks", "Webhooks");

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
                this.logger.debug("Webhook received:", maskPII(msg.data));
            }

            const data = msg.data as {
                webhookId: string;
                payload: unknown;
                rawPayload?: string;
                headers: Record<string, string>;
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

            for (const pluginId of Object.keys(this._registeredPlugins)) {
                if (webhookConfig.scriptId === pluginId) {
                    const event = {
                        webhook: this.toPublic(webhookConfig),
                        payload: data.payload,
                        rawPayload: data.rawPayload,
                        headers: data.headers ?? {}
                    };

                    try {
                        const handler = this._registeredPlugins[pluginId];
                        handler(event);
                    } catch (error) {
                        this.logger.warn(`Plugin ${pluginId} webhook handler threw`, error);
                    }
                }
            }

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

    private toPublic(config: WebhookConfig): PluginWebhook {
        return { id: config.id, name: config.name };
    }

    findPluginWebhookByName(pluginId: string, webhookName: string) {
        return this.getAllItems()
            .find(w => w.name === webhookName && w.scriptId === pluginId);
    }

    getPluginWebhook(pluginId: string, webhookName: string): PluginWebhook {
        if (pluginId == null || pluginId.trim() === ""
            || webhookName == null || webhookName.trim() === "") {
            return null;
        }
        const found = this.findPluginWebhookByName(pluginId, webhookName);
        return found ? this.toPublic(found) : null;
    }

    getAllPluginWebhooks(pluginId: string): PluginWebhook[] {
        return this.getAllItems()
            .filter(w => w.scriptId === pluginId)
            .map(this.toPublic);
    }

    savePluginWebhook(pluginId: string, webhookName: string): PluginWebhook {
        if (pluginId == null || pluginId.trim() === ""
            || webhookName == null || webhookName.trim() === "") {
            return null;
        }
        const existing = this.findPluginWebhookByName(pluginId, webhookName);
        const saved = this.saveItem({
            name: webhookName,
            id: existing?.id,
            scriptId: pluginId
        });
        return saved ? this.toPublic(saved) : null;
    }

    deletePluginWebhook(pluginId: string, webhookName: string): boolean {
        if (pluginId == null || pluginId.trim() === ""
            || webhookName == null || webhookName.trim() === "") {
            return false;
        }
        const existing = this.findPluginWebhookByName(pluginId, webhookName);
        if (!existing) {
            return false;
        }
        this.deleteItem(existing.id);
        return true;
    }

    getPluginWebhookUrl(pluginId: string, webhookName: string): string {
        const found = this.findPluginWebhookByName(pluginId, webhookName);
        if (!found) {
            return null;
        }
        return this.getWebhookUrlById(found.id);
    }

    registerPluginHandler(pluginId: string, handler: PluginWebhookEventHandler) {
        if (pluginId == null || pluginId.trim() === "" || handler == null) {
            return false;
        }

        if (this._registeredPlugins[pluginId] != null) {
            this.logger.warn(`Plugin ${pluginId} already has a handler registered`);
            return false;
        }

        this._registeredPlugins[pluginId] = handler;
        this.logger.info(`Registered handler for plugin ${pluginId}`);
        return true;
    }

    unregisterPluginHandler(pluginId: string) {
        if (pluginId == null || pluginId.trim() === "") {
            return false;
        }

        if (this._registeredPlugins[pluginId] == null) {
            this.logger.warn(`Plugin ${pluginId} does not have a handler registered`);
            return false;
        }

        delete this._registeredPlugins[pluginId];
        this.logger.info(`Unregistered handler for plugin ${pluginId}`);
        return true;
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
