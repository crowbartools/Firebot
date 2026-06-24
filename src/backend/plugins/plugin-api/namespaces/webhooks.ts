import type { PluginWebhooksApi } from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";

import webhookManager from "../../../webhooks/webhook-config-manager";

export const createWebhooksApi = definePluginApiNamespace<PluginWebhooksApi>((ctx) => {
    return {
        get(name) {
            return webhookManager.getPluginWebhook(ctx.pluginId, name);
        },

        list() {
            return webhookManager.getAllPluginWebhooks(ctx.pluginId);
        },

        getUrl(name) {
            return webhookManager.getPluginWebhookUrl(ctx.pluginId, name);
        }
    };
});
