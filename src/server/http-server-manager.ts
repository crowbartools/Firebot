import { EventEmitter } from "events";
import express, { Express, Request, Response, Router } from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from 'cors';
import path from 'path';

import { Awaitable } from "../types/util-types";
import { SettingsManager } from "../backend/common/settings-manager";
import { EffectManager } from "../backend/effects/effect-manager";
import { ResourceTokenManager } from "../backend/resource-token-manager";
import websocketServerManager from "./websocket-server-manager";
import { CustomWebSocketHandler } from "../types/websocket";
import overlayWidgetManager from "../backend/overlay-widgets/overlay-widgets-manager";
import logger from "../backend/logwrapper";

import * as dataAccess from "../backend/common/data-access";
import frontendCommunicator from "../backend/common/frontend-communicator";

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
    callback: (req: Request, res: Response) => Awaitable<void>;
}

class HttpServerManager extends EventEmitter {
    serverInstances: ServerInstance[];
    defaultServerInstance: Express;
    defaultHttpServer: http.Server;
    overlayServer: http.Server;
    isDefaultServerStarted: boolean;
    overlayHasClients: boolean;
    customRouteRouter: Router;
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
        this.setMaxListeners(0);

        // eslint-disable-next-line new-cap
        this.customRouteRouter = express.Router();
    }

    start(): void {
        // Default overlay server is already running.
        if (this.overlayServer != null) {
            logger.error("Overlay server is already running... is another instance running?");
            return;
        }

        this.defaultServerInstance = this.createDefaultServerInstance();
        this.defaultHttpServer = http.createServer(this.defaultServerInstance);
        this.startDefaultHttpServer();
    }

    createDefaultServerInstance(): Express {
        const app = express();

        // Cache buster
        app.use((_, res, next) => {
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
        const v1Router = require("./api/v1/v1-router");
        app.use("/api/v1", v1Router);

        app.get("/api/v1/auth/callback", (_, res) => {
            res.sendFile(path.join(`${__dirname}/authcallback.html`));
        });

        app.get('/loginsuccess', (_, res) => {
            res.sendFile(path.join(`${__dirname}/loginsuccess.html`));
        });


        // Set up route to serve overlay
        app.use("/overlay/", express.static(path.join(cwd, './resources/overlay/')));
        app.get("/overlay/", (req, res) => {
            const effectDefs = EffectManager.getEffectOverlayExtensions();

            const widgetExtensions = overlayWidgetManager.getOverlayExtensions();

            const combinedCssDeps = [...new Set(
                [...effectDefs
                    .filter(ed => ed.dependencies?.css?.length)
                    .map(ed => ed.dependencies.css),
                ...widgetExtensions
                    .filter(we => we.dependencies?.css?.length)
                    .map(we => we.dependencies.css)
                ].flat())];

            const combinedJsDeps = [...new Set([
                ...effectDefs
                    .filter(ed => ed.dependencies?.js?.length)
                    .map(ed => ed.dependencies.js),
                ...widgetExtensions
                    .filter(we => we.dependencies?.js?.length)
                    .map(we => we.dependencies.js)
            ].flat())];

            const combinedGlobalStyles = [
                ...effectDefs
                    .filter(ed => ed.dependencies?.globalStyles?.length)
                    .map(ed => ed.dependencies.globalStyles),
                ...widgetExtensions
                    .filter(we => we.dependencies?.globalStyles?.length)
                    .map(we => we.dependencies.globalStyles)
            ];

            const widgetEvents: Array<{ name: string, callback: Function }> = [];
            for (const widgetExtension of widgetExtensions) {
                if (widgetExtension.eventHandler) {
                    widgetEvents.push({
                        name: `overlay-widget:${widgetExtension.typeId}`,
                        callback: widgetExtension.eventHandler
                    });
                }
            }

            const overlayTemplate = path.join(cwd, './resources/overlay');
            res.render(overlayTemplate, {
                effectEvents: effectDefs.map(ed => ed.event),
                widgetEvents: widgetEvents,
                widgetInitCallbacks: widgetExtensions.filter(we => we.onInitialLoad).map(we => ({ typeId: we.typeId, callback: we.onInitialLoad })),
                dependencies: {
                    css: combinedCssDeps,
                    js: combinedJsDeps,
                    globalStyles: combinedGlobalStyles
                }
            });
        });
        app.use("/overlay-resources", express.static(dataAccess.getPathInUserData("/overlay-resources")));

        // Set up resource endpoint
        app.get("/resource/:token", (req, res) => {
            const token = req.params.token || null;
            if (token !== null) {
                let resourcePath = ResourceTokenManager.getResourcePath(token) || null;
                if (resourcePath !== null) {
                    resourcePath = resourcePath.replace(/\\/g, "/");
                    res.sendFile(resourcePath, { dotfiles: "allow" });
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
                    path: this.getCustomRoutePathFromRoot(cr.fullRoute),
                    method: cr.method
                };
            });

            res.json(registeredCustomRoutes);
        });

        // Handle custom routes
        app.use(this.customRouteRouter);

        // Catch all remaining paths and send the caller a 404
        app.use((req, res) => {
            res
                .status(404)
                .send({ status: "error", message: `${req.originalUrl} not found` });
        });

        return app;
    }

    startDefaultHttpServer(): void {
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

    refreshAllOverlays() {
        websocketServerManager.refreshAllOverlays();
    }

    /**
     * Refresh a specific overlay instance
     * @param overlayInstance the instance to refresh, leave undefined to refresh default
     */
    refreshOverlayInstance(overlayInstance?: string) {
        websocketServerManager.sendToOverlay("OVERLAY:REFRESH", undefined, overlayInstance);
    }

    triggerCustomWebSocketEvent(eventType: string, payload: object) {
        websocketServerManager.triggerEvent(`custom-event:${eventType}`, payload);
    }

    createServerInstance(): Express {
        const app = express();

        return app;
    }

    startHttpServer(name: string, port: number, instance: Express): http.Server {
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

    stopHttpServer(name): boolean {
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

    registerCustomRoute(
        prefix: string,
        route: string,
        method: string,
        callback: CustomRoute["callback"]
    ): boolean {
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

        switch (normalizedMethod) {
            case "GET":
                this.customRouteRouter.get(
                    this.getCustomRoutePathFromRoot(fullRoute),
                    callback
                );
                break;

            case "POST":
                this.customRouteRouter.post(
                    this.getCustomRoutePathFromRoot(fullRoute),
                    callback
                );
                break;

            case "PUT":
                this.customRouteRouter.put(
                    this.getCustomRoutePathFromRoot(fullRoute),
                    callback
                );
                break;

            case "PATCH":
                this.customRouteRouter.patch(
                    this.getCustomRoutePathFromRoot(fullRoute),
                    callback
                );
                break;

            case "DELETE":
                this.customRouteRouter.delete(
                    this.getCustomRoutePathFromRoot(fullRoute),
                    callback
                );
                break;

            case "HEAD":
                this.customRouteRouter.head(
                    this.getCustomRoutePathFromRoot(fullRoute),
                    callback
                );
                break;

            case "CONNECT":
                this.customRouteRouter.connect(
                    this.getCustomRoutePathFromRoot(fullRoute),
                    callback
                );
                break;

            case "OPTIONS":
                this.customRouteRouter.options(
                    this.getCustomRoutePathFromRoot(fullRoute),
                    callback
                );
                break;

            case "TRACE":
                this.customRouteRouter.trace(
                    this.getCustomRoutePathFromRoot(fullRoute),
                    callback
                );
                break;

            default:
                logger.error(`Failed to register custom route "${normalizedMethod} ${fullRoute}": ${normalizedMethod} is not a recognzied HTTP method.`);
                return false;
        }

        this.customRoutes.push({
            prefix: normalizedPrefix,
            route: normalizedRoute,
            fullRoute: fullRoute,
            method: normalizedMethod,
            callback: callback
        });

        logger.info(`Registered custom route "${normalizedMethod} ${this.getCustomRoutePathFromRoot(fullRoute)}"`);
        return true;
    }

    unregisterCustomRoute(prefix: string, route: string, method: string): boolean {
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

        this.removeCustomRoute(
            this.getCustomRoutePathFromRoot(fullRoute),
            normalizedMethod.toLowerCase()
        );

        logger.info(`Unegistered custom route "${normalizedMethod} ${this.getCustomRoutePathFromRoot(fullRoute)}"`);
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

    private getCustomRoutePathFromRoot(fullRoute: string): string {
        return `/integrations/${fullRoute}`;
    }

    private removeCustomRoute(path: string, method: string): void {
        const stacksToRemove = [];
        this.customRouteRouter.stack.forEach((s) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (s.route?.path === path && (s.route as any).methods[method] === true
            ) {
                stacksToRemove.push(s);
            }
        });

        for (const stack of stacksToRemove) {
            const i = this.customRouteRouter.stack.indexOf(stack);
            this.customRouteRouter.stack.splice(i, 1);
        }
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

frontendCommunicator.on("getOverlayStatus", () => {
    return {
        clientsConnected: websocketServerManager.overlayHasClients,
        serverStarted: manager.isDefaultServerStarted
    };
});

export = manager;
