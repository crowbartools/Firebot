import type {
    ScriptWebhook,
    ScriptWebhookEvent,
    ScriptWebhookEventHandler,
    ScriptWebhooksApi
} from "../../../../types/script-api";
import type { WebhookConfig } from "../../../../types/webhooks";
import { defineScriptApiNamespace } from "../internal/define-namespace";

import webhookManager from "../../../webhooks/webhook-config-manager";

function toPublic(config: WebhookConfig): ScriptWebhook {
    return { id: config.id, name: config.name };
}

export const createWebhooksApi = defineScriptApiNamespace<ScriptWebhooksApi>((ctx) => {
    const handlers = new Set<ScriptWebhookEventHandler>();

    const onManagerReceived = (data: {
        config: WebhookConfig;
        payload: unknown;
        rawPayload?: string;
        headers: Record<string, string>;
    }) => {
        if (data.config.scriptId !== ctx.scriptId) {
            return;
        }
        const event: ScriptWebhookEvent = {
            webhook: toPublic(data.config),
            payload: data.payload,
            rawPayload: data.rawPayload,
            headers: data.headers ?? {}
        };
        for (const handler of handlers) {
            try {
                handler(event);
            } catch (error) {
                ctx.logger.warn(`webhook handler threw`, error);
            }
        }
    };

    webhookManager.on("webhook-received", onManagerReceived);
    ctx.onDispose(() => {
        webhookManager.off("webhook-received", onManagerReceived);
        handlers.clear();
    });

    function findByName(name: string): WebhookConfig | undefined {
        return webhookManager
            .getAllItems()
            .find(w => w.name === name && w.scriptId === ctx.scriptId);
    }

    return {
        save(name) {
            if (name == null || name.trim() === "") {
                return null;
            }
            const existing = findByName(name);
            const saved = webhookManager.saveItem({
                name,
                id: existing?.id,
                scriptId: ctx.scriptId
            } as WebhookConfig);
            return saved ? toPublic(saved) : null;
        },

        get(name) {
            if (name == null || name.trim() === "") {
                return null;
            }
            const found = findByName(name);
            return found ? toPublic(found) : null;
        },

        delete(name) {
            if (name == null || name.trim() === "") {
                return false;
            }
            const existing = findByName(name);
            if (!existing) {
                return false;
            }
            webhookManager.deleteItem(existing.id);
            return true;
        },

        list() {
            return webhookManager
                .getAllItems()
                .filter(w => w.scriptId === ctx.scriptId)
                .map(toPublic);
        },

        getUrl(name) {
            const found = findByName(name);
            if (!found) {
                return null;
            }
            return webhookManager.getWebhookUrlById(found.id);
        },

        onReceived(handler) {
            handlers.add(handler);
            const unsubscribe = () => {
                handlers.delete(handler);
            };
            ctx.onDispose(unsubscribe);
            return unsubscribe;
        }
    };
});


