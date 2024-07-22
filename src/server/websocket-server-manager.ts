import effectManager from "../backend/effects/effectManager";
import electron from "electron";
import { EventEmitter } from "events";
import eventManager from "../backend/events/EventManager";
import http from "http";
import logger from "../backend/logwrapper";
import WebSocket from "ws";

class WebSocketServerManager extends EventEmitter {
    overlayHasClients = false;

    private server: WebSocket.Server;

    createServer(httpServer: http.Server) {
        this.server = new WebSocket.Server({
            server: httpServer
        });

        this.server.on('connection', (ws) => {
            ws.on('message', (message) => {
                try {
                    const event = JSON.parse(message.toString());

                    if (event.name === "overlay-connected") {
                        eventManager.triggerEvent("firebot", "overlay-connected", {
                            instanceName: event.data.instanceName
                        });
                        this.emit("overlay-connected", event.data.instanceName);
                    } else {
                        this.emit("overlay-event", event);
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
            if (client.readyState === 1) {
                client.send(dataRaw, (err) => {
                    if (err) {
                        logger.error(err.message);
                    }
                });
            }
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