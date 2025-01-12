import { EventEmitter } from "events";
import { ipcMain } from "electron";
import express, { Express, Request, Response } from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from 'cors';
import path from 'path';
import logger from "../backend/logwrapper";
import { SettingsManager } from "../backend/common/settings-manager";
import effectManager from "../backend/effects/effectManager";
import { ResourceTokenManager } from "../backend/resource-token-manager";
import websocketServerManager from "./websocket-server-manager";
import { CustomWebSocketHandler } from "../types/websocket";

import dataAccess from "../backend/common/data-access";

const cwd = dataAccess.getWorkingDirectoryPath();

interface ServerInstance {
    name: string;
    port: number;
    server: http.Server;
}

type HttpMethod =
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE"
    | "HEAD"
    | "CONNECT"
    | "OPTIONS"
    | "TRACE";

interface CustomRoute {
    prefix: string;
    route: string;
    fullRoute: string;
    method: HttpMethod;
    callback: (req: Request, res: Response) => Promise<void> | void;
}

class HttpServerManager extends EventEmitter {
    serverInstances: ServerInstance[];
    defaultServerInstance: Express;
    defaultHttpServer: http.Server;
    overlayServer: http.Server;
    isDefaultServerStarted: boolean;
    overlayHasClients: boolean;
    customRoutes: CustomRoute[];

    constructor() {
        super();

        this.serverInstances = [];
        this.defaultServerInstance = null;
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

        // Cache buster
        app.use(function (_, res, next) {
            res.setHeader("Expires", "0");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
            res.setHeader("Surrogate-Control", "no-store");
            next();
        });
        app.use(cors());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.set("view engine", "ejs");

        // Get our router for the current v1 api methods
        const v1Router = require("./api/v1/v1Router");
        app.use("/api/v1", v1Router);

        app.get("/api/v1/auth/callback", function(_, res) {
            res.sendFile(path.join(`${__dirname}/authcallback.html`));
        });

        app.get('/loginsuccess', function(_, res) {
            res.sendFile(path.join(`${__dirname}/loginsuccess.html`));
        });


        // Set up route to serve overlay
        app.use("/overlay/", express.static(path.join(cwd, './resources/overlay/')));
        app.get("/overlay/", function(req, res) {
            const effectDefs = effectManager.getEffectOverlayExtensions();

            const combinedCssDeps = [...new Set(effectDefs
                .filter(ed => ed.dependencies != null && ed.dependencies.css != null)
                .map(ed => ed.dependencies.css))];

            const combinedJsDeps = [...new Set(effectDefs
                .filter(ed => ed != null && ed.dependencies != null && ed.dependencies.js != null)
                .map(ed => ed.dependencies.js))];

            const combinedGlobalStyles = effectDefs
                .filter(ed => ed != null && ed.dependencies != null && ed.dependencies.globalStyles != null)
                .map(ed => ed.dependencies.globalStyles);

            const overlayTemplate = path.join(cwd, './resources/overlay');
            res.render(overlayTemplate, {
                events: effectDefs.map(ed => ed.event),
                dependencies: {
                    css: combinedCssDeps,
                    js: combinedJsDeps,
                    globalStyles: combinedGlobalStyles
                }
            });
        });
        app.use("/overlay-resources", express.static(dataAccess.getPathInUserData("/overlay-resources")));

        // Set up resource endpoint
        app.get("/resource/:token", function(req, res) {
            const token = req.params.token || null;
            if (token !== null) {
                let resourcePath = ResourceTokenManager.getResourcePath(token) || null;
                if (resourcePath !== null) {
                    resourcePath = resourcePath.replace(/\\/g, "/");
                    res.sendFile(resourcePath);
                    return;
                }
            }

            res
                .status(404)
                .send({ status: "error", message: `${req.originalUrl} not found` });
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
            const customRouteEntry = this.customRoutes.find(cr =>
                cr.fullRoute === fullCustomRoute &&
                cr.method === req.method
            );

            if (customRouteEntry == null) {
                res
                    .status(404)
                    .send({ status: "error", message: `${req.originalUrl} not found` });
            } else {
                customRouteEntry.callback(req, res);
            }
        });

        // Catch all remaining paths and send the caller a 404
        app.use(function(req, res) {
            res
                .status(404)
                .send({ status: "error", message: `${req.originalUrl} not found` });
        });

        return app;
    }

    startDefaultHttpServer() {
        const port: number = SettingsManager.getSetting("WebServerPort");

        websocketServerManager.createServer(this.defaultHttpServer);

        // Shim for any consumers of the EventEmitter

        websocketServerManager.on("overlay-connected", (instanceName: string) => {
            this.emit("overlay-connected", instanceName);
        });

        websocketServerManager.on("overlay-event", (event: unknown) => {
            this.emit("overlay-event", event);
        });

        try {
            // According to typescript and the documentation, this should not be possible. But it clearly works in the bot
            // @ts-expect-error TS2769
            this.overlayServer = this.defaultHttpServer.listen(port, ["0.0.0.0", "::"], () => {
                this.isDefaultServerStarted = true;

                this.serverInstances.push({
                    name: "Default",
                    port: port,
                    server: this.overlayServer
                });

                const addressInfo = this.overlayServer.address();
                logger.info(`Default web server started, listening on port ${typeof addressInfo === 'string' ? addressInfo : addressInfo.port}`);
            });
        } catch (error) {
            logger.error(`Unable to start default web server on port ${port}: ${error}`);
        }
    }

    sendToOverlay(eventName: string, meta: Record<string, unknown> = {}, overlayInstance: string = null) {
        websocketServerManager.sendToOverlay(eventName, meta, overlayInstance);
    }

    triggerCustomWebSocketEvent(eventType: string, payload: object) {
        websocketServerManager.triggerEvent(`custom-event:${eventType}`, payload);
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
            // According to typescript and the documentation, this should not be possible. But it clearly works in the bot
            // @ts-expect-error TS2769
            newHttpServer = newHttpServer.listen(port, ["0.0.0.0", "::"]);

            this.serverInstances.push({
                name: name,
                port: port,
                server: newHttpServer
            });

            const addressInfo = this.overlayServer.address();
            logger.info(`Default web server started, listening on port ${typeof addressInfo === 'string' ? addressInfo : addressInfo.port}`);
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

    registerCustomRoute(prefix: string, route: string, method: string, callback: CustomRoute["callback"]) {
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

        if (this.customRoutes.findIndex(cr => cr.fullRoute === fullRoute && cr.method === normalizedMethod) > -1) {
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

    unregisterCustomRoute(prefix: string, route: string, method: string) {
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

        const customRouteIndex = this.customRoutes.findIndex(cr =>
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

    buildCustomRouteParameters(prefix: string, route: string, method: string) {
        const normalizedPrefix = prefix.toLowerCase();
        const normalizedRoute = route.toLowerCase().replace(/\/$/, '');
        const normalizedMethod = method.toUpperCase() as HttpMethod;

        // Force POSIX paths because URL
        const fullRoute = path.posix.join(normalizedPrefix, normalizedRoute);

        return {
            normalizedPrefix,
            normalizedRoute,
            normalizedMethod,
            fullRoute
        };
    }

    registerCustomWebSocketListener(pluginName: string, callback: CustomWebSocketHandler["callback"]): boolean {
        return websocketServerManager.registerCustomWebSocketListener(pluginName, callback);
    }

    unregisterCustomWebSocketListener(pluginName: string): boolean {
        return websocketServerManager.unregisterCustomWebSocketListener(pluginName);
    }
}

const manager = new HttpServerManager();

setInterval(() => websocketServerManager.reportClientsToFrontend(manager.isDefaultServerStarted), 3000);

ipcMain.on("getOverlayStatus", (event) => {
    event.returnValue = {
        clientsConnected: websocketServerManager.overlayHasClients,
        serverStarted: manager.isDefaultServerStarted
    };
});

export = manager;
