import {
    PluginBase,
    LegacyCustomScript,
    Plugin,
    PluginContext,
    InstalledPluginConfig,
    PluginDetails
} from "../../../types";
import {
    IPluginExecutor,
    PluginRegistrations,
    PluginExecutionResult
} from "./plugin-executor.interface";
import { PluginApiContext } from "../plugin-api";

import { EffectManager } from "../../effects/effect-manager";
import { ReplaceVariableManager } from "../../variables/replace-variable-manager";
import { EventManager } from "../../events/event-manager";
import { FilterManager } from "../../events/filters/filter-manager";
import { CommandManager } from "../../chat/commands/command-manager";
import { RestrictionsManager } from "../../restrictions/restriction-manager";
import { GameManager } from "../../games/game-manager";
import { LoggerCache } from "../../logger-cache";
import IntegrationManager from "../../integrations/integration-manager";
import UIExtensionManager from "../../ui-extensions/ui-extension-manager";
import OverlayWidgetManager from "../../overlay-widgets/overlay-widgets-manager";
import { HttpServerManager } from "../../../server/http-server-manager";
import { WebSocketServerManager } from "../../../server/websocket-server-manager";
import webhookManager from "../../webhooks/webhook-config-manager";
import { resolvePluginManifestLinks } from "../plugin-manifest-utils";

const logger = LoggerCache.getLogger("Plugins");

/**
 * Executor for new-spec Plugins (manifest.type === "plugin")
 */
export class PluginExecutor extends IPluginExecutor {
    constructor() {
        super();
    }

    canHandle(plugin: PluginBase | LegacyCustomScript) {
        return this.isPlugin(plugin);
    }

    getPluginDetails(plugin: PluginBase | LegacyCustomScript): PluginDetails | null {
        if (!this.isPlugin(plugin)) {
            return null;
        }

        return {
            manifest: resolvePluginManifestLinks(plugin.manifest),
            parametersSchema: plugin.parametersSchema
        };
    }

    async executePlugin(
        plugin: PluginBase | LegacyCustomScript,
        config: InstalledPluginConfig,
        isInstalling?: boolean,
        ctx?: PluginApiContext
    ): Promise<PluginExecutionResult> {
        if (!this.isPlugin(plugin)) {
            return {
                success: false,
                error: "Invalid plugin type"
            };
        }

        const context: PluginContext = {
            parameters: this.buildParameters(plugin, config)
        };

        const registrations: PluginRegistrations = {};

        try {
            if (plugin.registers) {
                await this.registerAll(plugin, config, context, registrations, ctx);
            }

            await plugin.onLoad?.(context, isInstalling);
        } catch (error) {
            // best-effort rollback of anything we did register
            this.runUnregistrations(registrations);
            return {
                success: false,
                error: (error as Error)?.message ?? "Error while loading plugin"
            };
        }

        return {
            success: true,
            registrations
        };
    }

    async unloadPlugin(
        plugin: PluginBase | LegacyCustomScript,
        config: InstalledPluginConfig,
        registrations?: PluginRegistrations,
        isUninstalling?: boolean
    ): Promise<void> {
        if (!this.isPlugin(plugin)) {
            return;
        }

        if (registrations) {
            this.runUnregistrations(registrations);
        }

        const context: PluginContext = {
            parameters: this.buildParameters(plugin, config)
        };

        try {
            await plugin.onUnload?.(context, isUninstalling);
        } catch (error) {
            logger.error("Error during plugin onUnload", error);
        }

        if (isUninstalling === true) {
            const r = plugin.registers;
            if (r == null) {
                return;
            }

            const resolve = async <T>(item: T | ((c: PluginContext) => T | PromiseLike<T>)): Promise<T> => {
                return typeof item === "function"
                    ? await (item as (c: PluginContext) => T | PromiseLike<T>)(context)
                    : item;
            };

            if (r.webhooks != null) {
                const webhooks = await resolve(r.webhooks);
                if (webhooks != null) {
                    if (Array.isArray(webhooks.webhookNames)) {
                        for (const name of webhooks.webhookNames) {
                            webhookManager.deletePluginWebhook(config.id, name);
                        }
                    }
                }
            }
        }
    }

    async updateParameters(
        plugin: PluginBase | LegacyCustomScript,
        config: InstalledPluginConfig
    ): Promise<void> {
        if (!this.isPlugin(plugin)) {
            return;
        }

        if (typeof plugin.onParameterUpdate === "function") {
            const context: PluginContext = {
                parameters: this.buildParameters(plugin, config)
            };
            try {
                await plugin.onParameterUpdate(context);
            } catch (error) {
                logger.error("Error during plugin onParameterUpdate", error);
            }
        }
    }

    private async registerAll(
        plugin: Plugin,
        config: InstalledPluginConfig,
        context: PluginContext,
        registrations: PluginRegistrations,
        apiContext: PluginApiContext
    ) {
        const r = plugin.registers;
        if (r == null) {
            return;
        }

        const resolve = async <T>(item: T | ((c: PluginContext) => T | PromiseLike<T>)): Promise<T> => {
            return typeof item === "function"
                ? await (item as (c: PluginContext) => T | PromiseLike<T>)(context)
                : item;
        };

        if (Array.isArray(r.effects)) {
            registrations.effectIds = [];
            for (const entry of r.effects) {
                const def = await resolve(entry);
                if (def?.definition?.id) {
                    EffectManager.registerEffect(def);
                    registrations.effectIds.push(def.definition.id);
                }
            }
        }

        if (Array.isArray(r.variables)) {
            registrations.variableHandles = [];
            for (const entry of r.variables) {
                const def = await resolve(entry);
                if (def?.definition?.handle) {
                    ReplaceVariableManager.registerReplaceVariable(def);
                    registrations.variableHandles.push(def.definition.handle);
                }
            }
        }

        if (Array.isArray(r.eventSources)) {
            registrations.eventSourceIds = [];
            for (const entry of r.eventSources) {
                const def = (await resolve(entry)) as unknown as { id?: string };
                if (def?.id) {
                    EventManager.registerEventSource(def as never);
                    registrations.eventSourceIds.push(def.id);
                }
            }
        }

        if (Array.isArray(r.filters)) {
            registrations.filterIds = [];
            for (const entry of r.filters) {
                const def = await resolve(entry);
                if (def?.id) {
                    FilterManager.registerFilter(def);
                    registrations.filterIds.push(def.id);
                }
            }
        }

        if (Array.isArray(r.systemCommands)) {
            registrations.systemCommandIds = [];
            for (const entry of r.systemCommands) {
                const def = await resolve(entry);
                if (def?.definition?.id) {
                    CommandManager.registerSystemCommand(def);
                    registrations.systemCommandIds.push(def.definition.id);
                }
            }
        }

        if (Array.isArray(r.restrictions)) {
            registrations.restrictionIds = [];
            for (const entry of r.restrictions) {
                const def = await resolve(entry);
                if (def?.definition?.id) {
                    RestrictionsManager.registerRestriction(def);
                    registrations.restrictionIds.push(def.definition.id);
                }
            }
        }

        if (Array.isArray(r.integrations)) {
            registrations.integrationIds = [];
            for (const entry of r.integrations) {
                const def = await resolve(entry);
                const id = def?.definition?.id;
                if (id) {
                    IntegrationManager.registerIntegration(def);
                    registrations.integrationIds.push(id);
                }
            }
        }

        if (Array.isArray(r.games)) {
            registrations.gameIds = [];
            for (const entry of r.games) {
                const def = await resolve(entry);
                if (def?.id) {
                    GameManager.registerGame(def);
                    registrations.gameIds.push(def.id);
                }
            }
        }

        if (Array.isArray(r.uiExtensions)) {
            registrations.uiExtensionIds = [];
            for (const entry of r.uiExtensions) {
                const def = await resolve(entry);
                if (def?.id) {
                    UIExtensionManager.registerUIExtension(def);
                    registrations.uiExtensionIds.push(def.id);
                }
            }
        }

        if (Array.isArray(r.overlayWidgets)) {
            registrations.overlayWidgetIds = [];
            for (const entry of r.overlayWidgets) {
                const def = await resolve(entry);
                if (def?.id) {
                    OverlayWidgetManager.registerOverlayWidgetType(def);
                    registrations.overlayWidgetIds.push(def.id);
                }
            }
        }

        if (r.httpRoutes != null) {
            const def = await resolve(r.httpRoutes);
            if (def != null) {
                if (HttpServerManager.registerPlugin({
                    name: plugin.manifest.name,
                    definition: def
                })) {
                    registrations.httpRoutePrefix = def.prefix;
                }
            }
        }

        if (r.websocketListener != null) {
            const def = await resolve(r.websocketListener);
            if (def != null) {
                if (WebSocketServerManager.registerCustomWebSocketListener(def.pluginName, def.handler)) {
                    registrations.websocketListenerName = def.pluginName;
                }
            }
        }

        if (r.webhooks != null) {
            const webhooks = await resolve(r.webhooks);
            if (webhooks != null) {
                if (webhooks.handler != null) {
                    webhookManager.registerPluginHandler(config.id, webhooks.handler);
                    const unsubscribe = () => {
                        webhookManager.unregisterPluginHandler(config.id);
                    };
                    apiContext.onDispose(unsubscribe);
                }

                if (Array.isArray(webhooks.webhookNames)) {
                    for (const name of webhooks.webhookNames) {
                        webhookManager.savePluginWebhook(config.id, name);
                    }
                }
            }
        }

        if (Array.isArray(r.additionalVariableEvents)) {
            registrations.additionalVariableEvents = [];
            for (const entry of r.additionalVariableEvents) {
                const def = await resolve(entry);
                if (def?.handle && Array.isArray(def.events)) {
                    for (const event of def.events) {
                        ReplaceVariableManager.addEventToVariable(def.handle, event.eventSourceId, event.eventId);
                        registrations.additionalVariableEvents.push({
                            handle: def.handle,
                            eventSourceId: event.eventSourceId,
                            eventId: event.eventId
                        });
                    }
                }
            }
        }

        if (Array.isArray(r.additionalEffectEvents)) {
            registrations.additionalEffectEvents = [];
            for (const entry of r.additionalEffectEvents) {
                const def = await resolve(entry);
                if (def?.effectId && Array.isArray(def.events)) {
                    for (const event of def.events) {
                        EffectManager.addEventToEffect(def.effectId, event.eventSourceId, event.eventId);
                        registrations.additionalEffectEvents.push({
                            effectId: def.effectId,
                            eventSourceId: event.eventSourceId,
                            eventId: event.eventId
                        });
                    }
                }
            }
        }
    }

    private runUnregistrations(registrations: PluginRegistrations) {
        for (const id of registrations.effectIds ?? []) {
            try {
                EffectManager.unregisterEffect(id);
            } catch (e) {
                logger.warn(`Failed to unregister effect ${id}`, e);
            }
        }
        for (const handle of registrations.variableHandles ?? []) {
            try {
                ReplaceVariableManager.unregisterReplaceVariable(handle);
            } catch (e) {
                logger.warn(`Failed to unregister variable ${handle}`, e);
            }
        }
        for (const id of registrations.eventSourceIds ?? []) {
            try {
                EventManager.unregisterEventSource(id);
            } catch (e) {
                logger.warn(`Failed to unregister event source ${id}`, e);
            }
        }
        for (const id of registrations.filterIds ?? []) {
            try {
                FilterManager.unregisterFilter(id);
            } catch (e) {
                logger.warn(`Failed to unregister filter ${id}`, e);
            }
        }
        for (const id of registrations.systemCommandIds ?? []) {
            try {
                CommandManager.unregisterSystemCommand(id);
            } catch (e) {
                logger.warn(`Failed to unregister system command ${id}`, e);
            }
        }
        for (const id of registrations.restrictionIds ?? []) {
            try {
                RestrictionsManager.unregisterRestriction(id);
            } catch (e) {
                logger.warn(`Failed to unregister restriction ${id}`, e);
            }
        }
        for (const id of registrations.integrationIds ?? []) {
            try {
                IntegrationManager.unregisterIntegration(id);
            } catch (e) {
                logger.warn(`Failed to unregister integration ${id}`, e);
            }
        }
        for (const id of registrations.gameIds ?? []) {
            try {
                GameManager.unregisterGame(id);
            } catch (e) {
                logger.warn(`Failed to unregister game ${id}`, e);
            }
        }

        // UI Extensions can't be dynamically unregistered. Users will need to restart Firebot to fully remove.

        for (const id of registrations.overlayWidgetIds ?? []) {
            try {
                OverlayWidgetManager.unregisterOverlayWidgetType(id);
            } catch (e) {
                logger.warn(`Failed to unregister overlay widget ${id}`, e);
            }
        }

        if (!!registrations.httpRoutePrefix?.length) {
            try {
                HttpServerManager.unregisterPlugin(registrations.httpRoutePrefix);
            } catch (e) {
                logger.warn(`Failed to unregister HTTP server plugin ${registrations.httpRoutePrefix}`, e);
            }
        }

        if (!!registrations.websocketListenerName?.length) {
            try {
                WebSocketServerManager.unregisterCustomWebSocketListener(registrations.websocketListenerName);
            } catch (e) {
                logger.warn(`Failed to unregister WebSocket plugin listener ${registrations.websocketListenerName}`, e);
            }
        }

        for (const varEvent of registrations.additionalVariableEvents ?? []) {
            try {
                ReplaceVariableManager.removeEventFromVariable(varEvent.handle, varEvent.eventSourceId, varEvent.eventId);
            } catch (e) {
                logger.warn(`Failed to unregister event ${varEvent.eventSourceId}:${varEvent.eventId} for variable ${varEvent.handle}`, e);
            }
        }

        for (const varEvent of registrations.additionalEffectEvents ?? []) {
            try {
                EffectManager.removeEventFromEffect(varEvent.effectId, varEvent.eventSourceId, varEvent.eventId);
            } catch (e) {
                logger.warn(`Failed to unregister event ${varEvent.eventSourceId}:${varEvent.eventId} for effect ${varEvent.effectId}`, e);
            }
        }
    }

    private buildParameters(plugin: Plugin, config: InstalledPluginConfig): Record<string, unknown> {
        const schema = plugin.parametersSchema ?? [];
        return schema.reduce<Record<string, unknown>>((acc, param) => {
            const name = param.name;
            if (config.parameters && Object.hasOwn(config.parameters, name)) {
                acc[name] = config.parameters[name];
            } else if (param.default != null) {
                acc[name] = param.default;
            }
            return acc;
        }, {});
    }

    private isPlugin(plugin: PluginBase | LegacyCustomScript): plugin is Plugin {
        return (plugin as PluginBase).manifest != null;
    }
}
