import effectManager from "../backend/effects/effectManager";
import electron from "electron";
import { EventEmitter } from "events";
import eventManager from "../backend/events/EventManager";
import http from "http";
import logger from "../backend/logwrapper";
import WebSocket from "ws";
import { OverlayConnectedData, OverlayEventData, WebSocketEventType, WebSocketMessage } from "../types/websocket";
import { WebSocketClient } from "./websocket-client";

class WebSocketServerManager extends EventEmitter {
    overlayHasClients = false;

    private server: WebSocket.Server<typeof WebSocketClient>;

    createServer(httpServer: http.Server) {
        this.server = new WebSocket.Server<typeof WebSocketClient>({
            server: httpServer
        });

        this.server.on('connection', (ws) => {
            ws.registrationTimeout = setTimeout(() => {
                ws.close(4000, "Registration timed out");
            }, 5000);

            ws.on('message', (message) => {
                try {
                    const event = JSON.parse(message.toString()) as WebSocketMessage;

                    switch (event.type) {
                        case "overlay-connected":
                        {
                            if (ws.type != null) {
                                return;
                            }

                            clearTimeout(ws.registrationTimeout);

                            ws.type = "overlay";

                            const instanceName = (event.data as OverlayConnectedData).instanceName;
                            eventManager.triggerEvent("firebot", "overlay-connected", {
                                instanceName
                            });
                            this.emit("overlay-connected", instanceName);
                            break;
                        }
                        case "overlay-event":
                        {
                            if (ws.type !== "overlay") {
                                return;
                            }
                            this.emit("overlay-event", event.data as OverlayEventData);
                            break;
                        }
                        case "subscribe":
                        {
                            if (ws.type != null) {
                                return;
                            }

                            ws.type = "events";

                            clearTimeout(ws.registrationTimeout);

                            break;
                        }
                        case "event":
                        default:
                        {
                            break;
                        }
                    }
                } catch (error) {
                    logger.error("Error parsing overlay event", error);
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

        const data = { event: eventName, meta: meta, overlayInstance: overlayInstance },
            dataRaw = JSON.stringify(data);

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

    triggerEvent(eventType: WebSocketEventType, payload: object) {
        if (this.server == null) {
            return;
        }

        this.server.clients.forEach(function each(client) {
            if (client.readyState !== 1 || client.type !== "events") {
                return;
            }

            client.send(JSON.stringify({
                type: "event",
                data: {
                    eventType,
                    data: payload
                }
            }), (err) => {
                if (err) {
                    logger.error(err.message);
                }
            });
        });
    }

    reportClientsToFrontend(isDefaultServerStarted: boolean) {
        const hasClients = this.server == null ? false : this.server.clients.size > 0;
        if (hasClients !== this.overlayHasClients) {
            const renderWindow: electron.BrowserWindow | undefined = global.renderWindow;

            if (global.hasOwnProperty("renderWindow") && renderWindow?.webContents?.isDestroyed() === false) {
                renderWindow.webContents.send("overlayStatusUpdate", {
                    clientsConnected: hasClients,
                    serverStarted: isDefaultServerStarted
                });
            }
            this.overlayHasClients = hasClients;
        }
    }
}

const manager = new WebSocketServerManager();

export = manager;