import type { PluginWebServerApi } from "../../../../types/plugin-api";

import { ResourceTokenManager } from "../../../resource-token-manager";
import { WebSocketServerManager } from "../../../../server/websocket-server-manager";

import { definePluginApiNamespace } from "../internal/define-namespace";

export const createWebServerApi = definePluginApiNamespace<PluginWebServerApi>(() => {
    return {
        sendWebSocketEvent: (name, data) => {
            WebSocketServerManager.triggerEvent(`custom-event:${name}`, data);
        },

        createResourceToken(path, ttl = null) {
            return ResourceTokenManager.storeResourcePath(path, ttl);
        }
    };
});