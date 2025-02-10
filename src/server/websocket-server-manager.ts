import effectManager from "../backend/effects/effectManager";
import { EventEmitter } from "events";
import eventManager from "../backend/events/EventManager";
import http from "http";
import logger from "../backend/logwrapper";
import WebSocket from "ws";
import { OverlayConnectedData, Message, ResponseMessage, EventMessage, InvokePluginMessage, CustomWebSocketHandler } from "../types/websocket";
import { WebSocketClient } from "./websocket-client";
import frontendCommunicator from "../backend/common/frontend-communicator";

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
                                    eventManager.triggerEvent("firebot", "overlay-connected", {
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
                    ws.close(4006, error.message);
                }
            });
        });

        effectManager.on("effectRegistered", (effect) => {
            if (effect.overlayExtension) {
                // tell the overlay to refresh because a new effect with an overlay extension has been registered
                this.sendToOverlay("OVERLAY:REFRESH", { global: true });
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

    triggerEvent(eventType: string, payload: object) {
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