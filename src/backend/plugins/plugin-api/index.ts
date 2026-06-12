import { app } from "electron";

import type { FirebotPluginApi } from "../../../types/plugin-api";
import type { PluginApiContext } from "./context";

import { AccountAccess } from "../../common/account-access";

import { createLoggerApi } from "./namespaces/logger";
import { createWebhooksApi } from "./namespaces/webhooks";
import { createStorageApi } from "./namespaces/storage";
import { createEventsApi } from "./namespaces/events";
import { createEffectsApi } from "./namespaces/effects";
import { createTwitchApi } from "./namespaces/twitch";
import { createParametersApi } from "./namespaces/parameters";
import { createFrontendCommunicatorApi } from "./namespaces/frontend-communicator";
import { createNotificationsApi } from "./namespaces/notifications";
import { createSettingsApi } from "./namespaces/settings";
import { createPluginsApi } from "./namespaces/plugins";
import { createWebServerApi } from "./namespaces/http-server";
import { createVariableFactoryApi } from "./namespaces/variable-factory";
import { createEventFilterFactoryApi } from "./namespaces/event-filter-factory";

/**
 * Composition root for the Firebot Plugin API
 */
export function buildPluginApi(ctx: PluginApiContext): FirebotPluginApi {
    const accounts = AccountAccess.getAccounts();
    return {
        version: app.getVersion(),
        accounts,
        logger: createLoggerApi(ctx),
        settings: createSettingsApi(ctx),
        webhooks: createWebhooksApi(ctx),
        storage: createStorageApi(ctx),
        events: createEventsApi(ctx),
        effects: createEffectsApi(ctx),
        twitch: createTwitchApi(ctx),
        parameters: createParametersApi(ctx),
        frontendCommunicator: createFrontendCommunicatorApi(ctx),
        notifications: createNotificationsApi(ctx),
        plugins: createPluginsApi(ctx),
        webServer: createWebServerApi(ctx),
        variableFactory: createVariableFactoryApi(ctx),
        eventFilterFactory: createEventFilterFactoryApi(ctx)
    };
}

export type { PluginApiContext, PluginApiContextSource } from "./context";
export { createPluginApiContext } from "./context";