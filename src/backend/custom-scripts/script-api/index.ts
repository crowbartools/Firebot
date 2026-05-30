import { app } from "electron";

import type { FirebotScriptApi } from "../../../types/script-api";
import type { ScriptApiContext } from "./context";

import { createLoggerApi } from "./namespaces/logger";
import { createWebhooksApi } from "./namespaces/webhooks";
import { createStorageApi } from "./namespaces/storage";
import { createEventsApi } from "./namespaces/events";
import { createEffectsApi } from "./namespaces/effects";
import { createTwitchApi } from "./namespaces/twitch";
import { createParametersApi } from "./namespaces/parameters";
import { createFrontendCommunicatorApi } from "./namespaces/frontend-communicator";

/**
 * Composition root for the Firebot Script API
 */
export function buildScriptApi(ctx: ScriptApiContext): FirebotScriptApi {
    return {
        version: app.getVersion(),
        logger: createLoggerApi(ctx),
        webhooks: createWebhooksApi(ctx),
        storage: createStorageApi(ctx),
        events: createEventsApi(ctx),
        effects: createEffectsApi(ctx),
        twitch: createTwitchApi(ctx),
        parameters: createParametersApi(ctx),
        frontendCommunicator: createFrontendCommunicatorApi(ctx)
    };
}

export type { ScriptApiContext, ScriptApiContextSource } from "./context";
export { createScriptApiContext } from "./context";
