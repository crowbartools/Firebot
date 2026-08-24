import { EventEmitter } from "events";
import http from "http";
import WebSocket from "ws";

import type {
    PluginWebSocketHandler,
    EffectType,
    EventMessage,
    InvokePluginMessage,
    Message,
    OverlayConnectedData,
    ResponseMessage,
    WidgetOverlayEvent,
    OverlayRequestWebSocketHandler,
    InvokeOverlayRequestMessage,
    Trigger
} from "../types";

import { WebSocketClient } from "./websocket-client";
import { EffectManager } from "../backend/effects/effect-manager";
import { EventManager } from "../backend/events/event-manager";
import { ReplaceVariableManager } from "../backend/variables/replace-variable-manager";
import frontendCommunicator from "../backend/common/frontend-communicator";
import { LoggerCache } from "../backend/logger-cache";

function sendResponse(ws: WebSocketClient, messageId: string | number, data: unknown = null) {
    const response: ResponseMessage = {
        type: "response",
        id: messageId,
        name: "success",
        data
    };
    ws.send(JSON.stringify(response));
}

function sendError(ws: WebSocketClient, messageId: string | number, errorMessage: string) {
    const error: ResponseMessage = {
        type: "response",
        id: messageId,
        name: "error",
        data: errorMessage
    };
    ws.send(JSON.stringify(error));
}

class WebSocketServerManager extends EventEmitter {
    private logger = LoggerCache.getLogger("WebSocket Server");
    overlayHasClients = false;

    private server: WebSocket.Server<typeof WebSocketClient>;
    private pluginHandlers: PluginWebSocketHandler[] = [];
    private overlayRequestHandlers: OverlayRequestWebSocketHandler[] = [];

    constructor() {
        super();
        this.setMaxListeners(0);

        this.registerOverlayRequestHandler<{
            text: string;
            trigger: Trigger;
        }, string>({
            name: "eval-replace-vars",
            handler: (data) => {
                return ReplaceVariableManager.populateStringWithTriggerData(data.text, data.trigger);
            }
        });
    }

    createServer(httpServer: http.Server) {
        this.server = new WebSocket.Server<typeof WebSocketClient>({
            server: httpServer
        });

        this.server.on('connection', (ws, req) => {
            ws.registrationTimeout = setTimeout(() => {
                this.logger.info(`Unknown Websocket connection timed out from ${req.socket.remoteAddress}`);
                ws.close(4000, "Registration timed out");
            }, 5000);

            ws.on('message', (data) => {
                this.logger.debug(`Incoming WebSocket message from: ${req.socket.remoteAddress}, message data: ${data.toString().replace(/(\n|\s+)/g, " ")}`);

                try {
                    const message = JSON.parse(data.toString()) as Message;

                    switch (message.type) {
                        case "invoke": {
                            switch (message.name) {
                                case "subscribe-events": {
                                    if (ws.type != null) {
                                        sendError(ws, message.id, "socket already subscribed");
                                        break;
                                    }

                                    clearTimeout(ws.registrationTimeout);
                                    ws.type = "events";

                                    this.logger.info(`Websocket Event Connection from ${req.socket.remoteAddress}`);

                                    sendResponse(ws, message.id);

                                    break;
                                }
                                case "overlay-connected": {
                                    if (ws.type != null) {
                                        sendError(ws, message.id, "socket already subscribed");
                                        break;
                                    }

                                    clearTimeout(ws.registrationTimeout);
                                    ws.type = "overlay";

                                    this.logger.info(`Websocket Overlay Connection from ${req.socket.remoteAddress}`);

                                    sendResponse(ws, message.id);

                                    const instanceName = (message.data as Array<OverlayConnectedData>)[0].instanceName;
                                    void EventManager.triggerEvent("firebot", "overlay-connected", {
                                        instanceName
                                    });
                                    this.emit("overlay-connected", instanceName);

                                    break;
                                }
                                case "control-deck-connected": {
                                    if (ws.type != null) {
                                        sendError(ws, message.id, "socket already subscribed");
                                        break;
                                    }

                                    clearTimeout(ws.registrationTimeout);
                                    ws.type = "control-deck";

                                    this.logger.info(`Websocket Control Deck Connection from ${req.socket.remoteAddress}`);

                                    sendResponse(ws, message.id);

                                    break;
                                }
                                case "plugin": {
                                    const pluginName = (message as InvokePluginMessage).pluginName;
                                    if (pluginName == null || pluginName === "") {
                                        sendError(ws, message.id, "Must specify pluginName");
                                        break;
                                    }
                                    const plugin = this.pluginHandlers.find(p => p.pluginName.toLowerCase() === pluginName.toLowerCase());

                                    if (plugin != null) {
                                        plugin.handler(message.data);
                                    } else {
                                        sendError(ws, message.id, "Unknown plugin name specified");
                                    }

                                    break;
                                }
                                case "overlay-request": {
                                    const requestMessage = (message as InvokeOverlayRequestMessage);
                                    const handler = this.overlayRequestHandlers.find(h => h.name === requestMessage.data.name);
                                    if (handler != null) {
                                        const result = handler.handler(requestMessage.data.data);
                                        if (result instanceof Promise) {
                                            result.then((responseData) => {
                                                sendResponse(ws, message.id, responseData);
                                            }).catch((err) => {
                                                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                                                sendError(ws, message.id, err.message);
                                            });
                                        } else {
                                            sendResponse(ws, message.id, result);
                                        }
                                    } else {
                                        sendError(ws, message.id, "Unknown overlay request name specified");
                                    }
                                    break;
                                }
                                default: {
                                    sendError(ws, message.id, "unknown command invocation");
                                    break;
                                }
                            }
                            break;
                        }
                        case "event": {
                            if (message.name !== "overlay-event") {
                                break;
                            }

                            if (ws.type !== "overlay") {
                                break;
                            }

                            this.emit("overlay-event", message.data);
                            break;
                        }
                        case "response":
                        default: {
                            break;
                        }
                    }
                } catch (error) {
                    ws.close(4006, (error as Error).message);
                }
            });
        });

        EffectManager.on("effectRegistered", (effect: EffectType) => {
            if (effect.overlayExtension) {
                // tell the overlay to refresh because a new effect with an overlay extension has been registered
                this.refreshAllOverlays();
            }
        });

        EffectManager.on("effectUnregistered", ({ hasOverlayEffect }) => {
            if (hasOverlayEffect) {
                // tell the overlay to refresh because a effect with an overlay extension has been removed
                this.refreshAllOverlays();
            }
        });
    }

    sendToOverlay(eventName: string, meta: Record<string, unknown> = {}, overlayInstance: string = null) {
        if (this.server == null || eventName == null) {
            return;
        }

        const data = { event: eventName, meta: meta, overlayInstance: overlayInstance };

        const message: EventMessage = {
            type: "event",
            name: "send-to-overlay",
            data
        };

        const dataRaw = JSON.stringify(message);

        this.server.clients.forEach((client) => {
            if (client.readyState !== 1 || client.type !== "overlay") {
                return;
            }

            client.send(dataRaw, (err) => {
                if (err) {
                    this.logger.error(err.message);
                }
            });
        });
    }

    sendWidgetEventToOverlay(event: WidgetOverlayEvent) {
        this.sendToOverlay("OVERLAY:WIDGET-EVENT", { event }, event.data.widgetConfig.overlayInstance ?? null);
    }

    refreshAllOverlays() {
        this.sendToOverlay("OVERLAY:REFRESH", { global: true });
    }

    sendToControlDecks(eventName: string, data: unknown = null) {
        if (this.server == null || eventName == null) {
            return;
        }

        const message: EventMessage = {
            type: "event",
            name: eventName,
            data
        };

        const dataRaw = JSON.stringify(message);

        this.server.clients.forEach((client) => {
            if (client.readyState !== 1 || client.type !== "control-deck") {
                return;
            }

            client.send(dataRaw, (err) => {
                if (err) {
                    this.logger.error(err.message);
                }
            });
        });
    }

    triggerEvent(eventType: string, payload: unknown) {
        if (this.server == null) {
            return;
        }

        const message: EventMessage = {
            type: "event",
            name: eventType,
            data: payload
        };

        const dataRaw = JSON.stringify(message);

        this.server.clients.forEach((client) => {
            if (client.readyState !== 1 || client.type !== "events") {
                return;
            }

            client.send(dataRaw, (err) => {
                if (err) {
                    this.logger.error(err.message);
                }
            });
        });
    }

    reportClientsToFrontend(isDefaultServerStarted: boolean) {
        let hasClients = this.server != null;
        if (hasClients) {
            hasClients = [...this.server.clients].filter(client => client.type === "overlay").length > 0;
        }
        if (hasClients !== this.overlayHasClients) {
            frontendCommunicator.send("http-server:overlay-status-update", {
                clientsConnected: hasClients,
                serverStarted: isDefaultServerStarted
            });
            this.overlayHasClients = hasClients;
        }
    }

    getNumberOfOverlayClients(): number {
        if (this.server == null) {
            return 0;
        }

        return [...this.server.clients].filter(client => client.type === "overlay").length;
    }

    registerCustomWebSocketListener(pluginName: string, handler: PluginWebSocketHandler["handler"]): boolean {
        if (this.pluginHandlers.findIndex(p => p.pluginName.toLowerCase() === pluginName.toLowerCase()) === -1) {
            this.pluginHandlers.push({
                pluginName,
                handler
            });
            this.logger.info(`Registered custom WebSocket listener for plugin "${pluginName}"`);
            return true;
        }

        this.logger.error(`Custom WebSocket listener "${pluginName}" already registered`);
        return false;
    }

    unregisterCustomWebSocketListener(pluginName: string): boolean {
        const pluginHandlerIndex = this.pluginHandlers.findIndex(p => p.pluginName.toLowerCase() === pluginName.toLowerCase());

        if (pluginHandlerIndex !== -1) {
            this.pluginHandlers.splice(pluginHandlerIndex, 1);
            this.logger.info(`Unregistered custom WebSocket listener for plugin "${pluginName}"`);
            return true;
        }

        this.logger.error(`Custom WebSocket listener "${pluginName}" is not registered`);
        return false;
    }

    registerOverlayRequestHandler<TData extends Record<string, unknown> = Record<string, unknown>, TResponse = unknown>(handler: OverlayRequestWebSocketHandler<TData, TResponse>): boolean {
        if (this.overlayRequestHandlers.findIndex(h => h.name === handler.name) === -1) {
            this.overlayRequestHandlers.push(handler);
            this.logger.info(`Registered overlay request handler for "${handler.name}"`);
            return true;
        }

        this.logger.error(`Overlay request handler "${handler.name}" already registered`);
        return false;
    }
}

const manager = new WebSocketServerManager();

export { manager as WebSocketServerManager };