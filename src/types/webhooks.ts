export type WebhookConfig = {
    id: string;
    name: string;
    scriptId?: string;
};

export interface PluginWebhook {
    id: string;
    name: string;
}

export interface PluginWebhookEvent {
    webhook: PluginWebhook;
    payload: unknown;
    rawPayload?: string;
    headers: Record<string, string>;
}

export type PluginWebhookEventHandler = (event: PluginWebhookEvent) => void;

export type PluginWebhooks = {
    webhookNames: string[];
    handler: PluginWebhookEventHandler;
};