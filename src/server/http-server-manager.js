"use strict";

const { EventEmitter } = require("events");
const { ipcMain } = require("electron");
const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require('cors');
const path = require('path');
const logger = require("../backend/logwrapper");
const { settings } = require("../backend/common/settings-access");
const effectManager = require("../backend/effects/effectManager");
const resourceTokenManager = require("../backend/resourceTokenManager");

const electron = require('electron');
const cwd = !electron.app.isPackaged ? path.join(electron.app.getAppPath(), "build") : process.cwd();


class HttpServerManager extends EventEmitter {
    constructor() {
        super();

        this.serverInstances = [];
        this.defaultServerInstance = null;
        this.defaultWebsocketServerInstance = null;
        this.defaultHttpServer = null;
        this.overlayServer = null;
        this.isDefaultServerStarted = false;
        this.overlayHasClients = false;
        this.customRoutes = [];
    }

    start() {
        // Default overlay server is already running.
        if (this.overlayServer != null) {
            logger.error("Overlay server is already running... is another instance running?");
            return;
        }

        this.defaultServerInstance = this.createDefaultServerInstance();
        this.defaultHttpServer = http.createServer(this.defaultServerInstance);
        this.startDefaultHttpServer();
    }

    createDefaultServerInstance() {
        const app = express();

        app.use(cors());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.set("view engine", "ejs");

        // Get our router for the current v1 api methods
        const v1Router = require("./api/v1/v1Router");
        app.use("/api/v1", v1Router);

        app.get("/api/v1/auth/callback", function(_, res) {
            res.sendFile(path.join(__dirname + '/authcallback.html'));
        });

        app.get('/loginsuccess', function(_, res) {
            res.sendFile(path.join(__dirname + '/loginsuccess.html'));
        });


        // Set up route to serve overlay
        app.use("/overlay/", express.static(path.join(cwd, './resources/overlay/')));
        app.get("/overlay/", function(req, res) {
            const effectDefs = effectManager.getEffectOverlayExtensions();

            const combinedCssDeps = [...new Set([].concat.apply([], effectDefs
                .filter(ed => ed.dependencies != null && ed.dependencies.css != null)
                .map(ed => ed.dependencies.css)))];

            const combinedJsDeps = [...new Set([].concat.apply([], effectDefs
                .filter(ed => ed.dependencies != null && ed.dependencies.js != null)
                .map(ed => ed.dependencies.js)))];

            const combinedGlobalStyles = effectDefs
                .filter(ed => ed != null && ed.dependencies != null && ed.dependencies.globalStyles != null)
                .map(ed => ed.dependencies.globalStyles);

            const overlayTemplate = path.join(cwd, './resources/overlay');
            res.render(overlayTemplate, {
                events: effectDefs.map(ed => ed.event),
                dependancies: {
                    css: combinedCssDeps,
                    js: combinedJsDeps,
                    globalStyles: combinedGlobalStyles
                }
            });
        });
        const dataAccess = require("../backend/common/data-access");
        app.use("/overlay-resources", express.static(dataAccess.getPathInUserData("/overlay-resources")));

        // Set up resource endpoint
        app.get("/resource/:token", function(req, res) {
            const token = req.params.token || null;
            if (token !== null) {
                let resourcePath = resourceTokenManager.getResourcePath(token) || null;
                if (resourcePath !== null) {
                    resourcePath = resourcePath.replace(/\\/g, "/");
                    res.sendFile(resourcePath);
                    return;
                }
            }

            res
                .status(404)
                .send({ status: "error", message: req.originalUrl + " not found" });
        });

        // List custom routes
        app.get("/integrations", (req, res) => {
            const registeredCustomRoutes = this.customRoutes.map((cr) => {
                return {
                    path: `/integrations/${cr.fullRoute}`,
                    method: cr.method
                };
            });

            res.json(registeredCustomRoutes);
        });

        // Handle custom routes
        app.use("/integrations/:customRoute", (req, res) => {
            const { customRoute } = req.params;

            // app.use only provides the predicate in req.path, not the full mount point
            // See here: https://expressjs.com/en/4x/api.html#req.path
            //
            // Also, remove the trailing slash for matching reasons
            const customRoutePredicate = req.path.toLowerCase().replace(/\/$/, '');
            const fullCustomRoute = `${customRoute}${customRoutePredicate}`;

            // Find the matching registered custom route
            const customRouteEntry = this.customRoutes.find((cr) =>
                cr.fullRoute === fullCustomRoute &&
                cr.method === req.method
            );

            if (customRouteEntry == null) {
                res
                    .status(404)
                    .send({ status: "error", message: req.originalUrl + " not found" });
            } else {
                customRouteEntry.callback(req, res);
            }
        });

        // Catch all remaining paths and send the caller a 404
        app.use(function(req, res) {
            res
                .status(404)
                .send({ status: "error", message: req.originalUrl + " not found" });
        });

        return app;
    }

    startDefaultHttpServer() {
        const port = settings.getWebServerPort();

        // Setup default Websocket server
        this.defaultWebsocketServerInstance = new WebSocket.Server({
            server: this.defaultHttpServer
        });

        this.defaultWebsocketServerInstance.on('connection', (ws) => {
            ws.on('message', (message) => {
                try {
                    const event = JSON.parse(message);
                    this.emit("overlay-event", event);
                } catch (error) {
                    logger.error("Error parsing overlay event", error);
                }
            });
        });

        try {
            this.overlayServer = this.defaultHttpServer.listen(port);
            this.isDefaultServerStarted = true;

            this.serverInstances.push({
                name: "Default",
                port: port,
                server: this.overlayServer
            });

            logger.info(`Default web server started, listening on port ${this.overlayServer.address().port}`);
        } catch (error) {
            logger.error(`Unable to start default web server on port ${port}: ${error}`);
        }
    }

    sendToOverlay(eventName, meta = {}, overlayInstance) {
        if (this.defaultWebsocketServerInstance == null || eventName == null) {
            return;
        }

        const data = { event: eventName, meta: meta, overlayInstance: overlayInstance },
            dataRaw = JSON.stringify(data);

        this.defaultWebsocketServerInstance.clients.forEach(function each(client) {
            if (client.readyState === 1) {
                client.send(dataRaw, err => {
                    if (err) {
                        logger.error(err);
                    }
                });
            }
        });
    }

    createServerInstance() {
        const app = express();

        return app;
    }

    startHttpServer(name, port, instance) {
        try {
            if (this.serverInstances.some(si => si.name === name)) {
                logger.error(`Web server instance named "${name}" is already running`);
                return;
            }

            let newHttpServer = http.createServer(instance);
            newHttpServer = newHttpServer.listen(port);

            this.serverInstances.push({
                name: name,
                port: port,
                server: newHttpServer
            });

            logger.info(`Web server instance "${name}" started, listening on port ${newHttpServer.address().port}`);
            return newHttpServer;
        } catch (error) {
            logger.error(`Unable to start web server instance "${name}" on port ${port}: ${error}`);
            return;
        }
    }

    stopHttpServer(name) {
        try {
            if (name === "Default") {
                logger.error("Default web server instance cannot be stopped");
                return false;
            }

            const instanceIndex = this.serverInstances.findIndex(si => si.name === name);

            if (instanceIndex === -1) {
                logger.warn(`No web server instance found with name "${name}"`);
                return true;
            }

            this.serverInstances[instanceIndex].server.close((error) => {
                if (error == null) {
                    this.serverInstances.splice(instanceIndex, 1);
                    return true;
                }

                logger.error(`Error stopping web server instance "${name}": ${error.message}`);
                return false;
            });
        } catch (error) {
            logger.error(`Unable to stop web server instance "${name}": ${error}`);
            return false;
        }
    }

    registerCustomRoute(prefix, route, method, callback) {
        if (prefix == null || prefix === "") {
            logger.error(`Failed to register custom route: No custom route prefix specified`);
            return false;
        }

        if (method == null || method === "") {
            logger.error(`Failed to register custom route: No custom route HTTP method specified`);
            return false;
        }

        if (callback == null || !(callback instanceof Function)) {
            logger.error(`Failed to register custom route: No/invalid callback function specified`);
            return false;
        }

        route = route ?? "";

        const {
            normalizedPrefix,
            normalizedRoute,
            normalizedMethod,
            fullRoute
        } = this.buildCustomRouteParameters(prefix, route, method);

        if (this.customRoutes.findIndex((cr) => cr.fullRoute === fullRoute && cr.method === normalizedMethod) > -1) {
            logger.error(`Failed to register custom route: Custom route already registered at "${fullRoute}"`);
            return false;
        }

        this.customRoutes.push({
            prefix: normalizedPrefix,
            route: normalizedRoute,
            fullRoute: fullRoute,
            method: normalizedMethod,
            callback: callback
        });

        logger.info(`Registered custom route "${normalizedMethod} /integrations/${fullRoute}"`);
        return true;
    }

    unregisterCustomRoute(prefix, route, method) {
        if (prefix == null || prefix === "") {
            logger.error(`Failed to unregister custom route: No custom route prefix specified`);
            return false;
        }

        if (method == null || method === "") {
            logger.error(`Failed to unregister custom route: No custom route HTTP method specified`);
            return false;
        }

        route = route ?? "";

        const {
            normalizedPrefix,
            normalizedRoute,
            normalizedMethod,
            fullRoute
        } = this.buildCustomRouteParameters(prefix, route, method);

        const customRouteIndex = this.customRoutes.findIndex((cr) =>
            cr.prefix === normalizedPrefix &&
            cr.route === normalizedRoute &&
            cr.method === normalizedMethod &&
            cr.fullRoute === fullRoute
        );

        if (customRouteIndex === -1) {
            logger.warn(`No custom route found with prefix "${normalizedPrefix}", route "${normalizedRoute}", and method "${normalizedMethod}"`);
            return false;
        }

        this.customRoutes.splice(customRouteIndex, 1);

        logger.info(`Unegistered custom route "${normalizedMethod} /integrations/${fullRoute}"`);
        return true;
    }

    buildCustomRouteParameters(prefix, route, method) {
        const normalizedPrefix = prefix.toLowerCase();
        const normalizedRoute = route.toLowerCase().replace(/\/$/, '');
        const normalizedMethod = method.toUpperCase();

        const fullRoute = path.join(normalizedPrefix, normalizedRoute)
            .replace("\\", "/");

        return {
            normalizedPrefix,
            normalizedRoute,
            normalizedMethod,
            fullRoute
        };
    }
}

const manager = new HttpServerManager();

setInterval(() => {
    const clientsConnected = manager.defaultWebsocketServerInstance == null
        ? false
        : manager.defaultWebsocketServerInstance.clients.size > 0;

    if (clientsConnected !== manager.overlayHasClients) {
        renderWindow.webContents.send("overlayStatusUpdate", {
            clientsConnected: clientsConnected,
            serverStarted: manager.isDefaultServerStarted
        });
        manager.overlayHasClients = clientsConnected;
    }
}, 3000);

ipcMain.on("getOverlayStatus", event => {
    event.returnValue = {
        clientsConnected: manager.overlayHasClients,
        serverStarted: manager.isDefaultServerStarted
    };
});

effectManager.on("effectRegistered", () => {
    // tell the overlay to refresh because a new effect has been registered
    manager.sendToOverlay("OVERLAY:REFRESH");
});

module.exports = manager;
