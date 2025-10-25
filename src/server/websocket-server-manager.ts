import { EventEmitter } from "events";
import http from "http";
import WebSocket from "ws";

import type { OverlayConnectedData, Message, ResponseMessage, EventMessage, InvokePluginMessage, CustomWebSocketHandler } from "../types/websocket";
import type { EffectType } from "../types/effects";

import { WebSocketClient } from "./websocket-client";
import { EffectManager } from "../backend/effects/effect-manager";
import { EventManager } from "../backend/events/event-manager";
import frontendCommunicator from "../backend/common/frontend-communicator";
import logger from "../backend/logwrapper";

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
    overlayHasClients = false;

    private server: WebSocket.Server<typeof WebSocketClient>;
    private customHandlers: CustomWebSocketHandler[] = [];

    constructor() {
        super();
        this.setMaxListeners(0);
    }

    createServer(httpServer: http.Server) {
        this.server = new WebSocket.Server<typeof WebSocketClient>({
            server: httpServer
        });

        this.server.on('connection', (ws, req) => {
            ws.registrationTimeout = setTimeout(() => {
                logger.info(`Unknown Websocket connection timed out from ${req.socket.remoteAddress}`);
                ws.close(4000, "Registration timed out");
            }, 5000);

            ws.on('message', (data) => {
                logger.debug(`Incoming WebSocket message from: ${req.socket.remoteAddress}, message data: ${data.toString().replace(/(\n|\s+)/g, " ")}`);

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

                                    logger.info(`Websocket Event Connection from ${req.socket.remoteAddress}`);

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

                                    logger.info(`Websocket Overlay Connection from ${req.socket.remoteAddress}`);

                                    sendResponse(ws, message.id);

                                    const instanceName = (message.data as Array<OverlayConnectedData>)[0].instanceName;
                                    void EventManager.triggerEvent("firebot", "overlay-connected", {
                                        instanceName
                                    });
                                    this.emit("overlay-connected", instanceName);

                                    break;
                                }
                                case "plugin": {
                                    const pluginName = (message as InvokePluginMessage).pluginName;
                                    if (pluginName == null || pluginName === "") {
                                        sendError(ws, message.id, "Must specify pluginName");
                                        break;
                                    }
                                    const plugin = this.customHandlers.find(p => p.pluginName.toLowerCase() === pluginName.toLowerCase());

                                    if (plugin != null) {
                                        plugin.callback(message.data);
                                    } else {
                                        sendError(ws, message.id, "Unknown plugin name specified");
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

        this.server.clients.forEach(function each(client) {
            if (client.readyState !== 1 || client.type !== "overlay") {
                return;
            }

            client.send(dataRaw, (err) => {
                if (err) {
                    logger.error(err.message);
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

        this.server.clients.forEach(function each(client) {
            if (client.readyState !== 1 || client.type !== "events") {
                return;
            }

            client.send(dataRaw, (err) => {
                if (err) {
                    logger.error(err.message);
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
            frontendCommunicator.send("overlayStatusUpdate", {
                clientsConnected: hasClients,
                serverStarted: isDefaultServerStarted
            });
            this.overlayHasClients = hasClients;
        }
    }

    registerCustomWebSocketListener(pluginName: string, callback: CustomWebSocketHandler["callback"]): boolean {
        if (this.customHandlers.findIndex(p => p.pluginName.toLowerCase() === pluginName.toLowerCase()) === -1) {
            this.customHandlers.push({
                pluginName,
                callback
            });
            logger.info(`Registered custom WebSocket listener for plugin "${pluginName}"`);
            return true;
        }

        logger.error(`Custom WebSocket listener "${pluginName}" already registered`);
        return false;
    }

    unregisterCustomWebSocketListener(pluginName: string): boolean {
        const pluginHandlerIndex = this.customHandlers.findIndex(p => p.pluginName.toLowerCase() === pluginName.toLowerCase());

        if (pluginHandlerIndex !== -1) {
            this.customHandlers.splice(pluginHandlerIndex, 1);
            logger.info(`Unregistered custom WebSocket listener for plugin "${pluginName}"`);
            return true;
        }

        logger.error(`Custom WebSocket listener "${pluginName}" is not registered`);
        return false;
    }
}

const manager = new WebSocketServerManager();

export = manager;