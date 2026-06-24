import type { PluginWebServerApi } from "../../../../types/plugin-api";

import { WebSocketServerManager } from "../../../../server/websocket-server-manager";

import { definePluginApiNamespace } from "../internal/define-namespace";

export const createWebServerApi = definePluginApiNamespace<PluginWebServerApi>(() => {
    return {
        sendWebSocketEvent: (name, data) => {
            WebSocketServerManager.triggerEvent(`custom-event:${name}`, data);
        }
    };
});