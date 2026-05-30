import {
    ScriptBase,
    LegacyCustomScript,
    Plugin,
    ScriptContext,
    InstalledPluginConfig,
    ScriptDetails
} from "../../../types";
import {
    IPluginExecutor,
    PluginRegistrations,
    PluginExecutionResult
} from "./script-executor.interface";
import { EffectManager } from "../../effects/effect-manager";
import { ReplaceVariableManager } from "../../variables/replace-variable-manager";
import { EventManager } from "../../events/event-manager";
import { FilterManager } from "../../events/filters/filter-manager";
import { CommandManager } from "../../chat/commands/command-manager";
import { RestrictionsManager } from "../../restrictions/restriction-manager";
import { GameManager } from "../../games/game-manager";
import logger from "../../logwrapper";
import IntegrationManager from "../../integrations/integration-manager";
import UIExtensionManager from "../../ui-extensions/ui-extension-manager";

/**
 * Executor for new-spec Plugins (manifest.type === "plugin")
 */
export class PluginExecutor extends IPluginExecutor {
    constructor() {
        super();
    }

    canHandle(script: ScriptBase | LegacyCustomScript) {
        return this.isPlugin(script);
    }

    getScriptDetails(script: ScriptBase | LegacyCustomScript): ScriptDetails | null {
        if (!this.isPlugin(script)) {
            return null;
        }

        return {
            manifest: script.manifest,
            parametersSchema: script.parametersSchema
        };
    }

    async executePlugin(
        script: ScriptBase | LegacyCustomScript,
        config: InstalledPluginConfig,
        isInstalling?: boolean
    ): Promise<PluginExecutionResult> {
        if (!this.isPlugin(script)) {
            return {
                success: false,
                error: "Invalid script type"
            };
        }

        const context: ScriptContext = {
            parameters: this.buildParameters(script, config)
        };

        const registrations: PluginRegistrations = {};

        try {
            if (script.registers) {
                await this.registerAll(script, context, registrations);
            }

            await script.onLoad?.(context, isInstalling);
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
        script: ScriptBase | LegacyCustomScript,
        config: InstalledPluginConfig,
        registrations?: PluginRegistrations,
        isUninstalling?: boolean
    ): Promise<void> {
        if (!this.isPlugin(script)) {
            return;
        }

        if (registrations) {
            this.runUnregistrations(registrations);
        }

        const context: ScriptContext = {
            parameters: this.buildParameters(script, config)
        };

        try {
            await script.onUnload?.(context, isUninstalling);
        } catch (error) {
            logger.error("Error during plugin onUnload", error);
        }
    }

    async updateParameters(
        script: ScriptBase | LegacyCustomScript,
        config: InstalledPluginConfig
    ): Promise<void> {
        if (!this.isPlugin(script)) {
            return;
        }

        if (typeof script.onParameterUpdate === "function") {
            const context: ScriptContext = {
                parameters: this.buildParameters(script, config)
            };
            try {
                await script.onParameterUpdate(context);
            } catch (error) {
                logger.error("Error during plugin onParameterUpdate", error);
            }
        }
    }

    private async registerAll(
        script: Plugin,
        context: ScriptContext,
        registrations: PluginRegistrations
    ) {
        const r = script.registers;
        if (r == null) {
            return;
        }

        const resolve = async <T>(item: T | ((c: ScriptContext) => T | PromiseLike<T>)): Promise<T> => {
            return typeof item === "function"
                ? await (item as (c: ScriptContext) => T | PromiseLike<T>)(context)
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
    }

    private buildParameters(script: Plugin, config: InstalledPluginConfig): Record<string, unknown> {
        const schema = script.parametersSchema ?? [];
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

    private isPlugin(script: ScriptBase | LegacyCustomScript): script is Plugin {
        return (script as ScriptBase).manifest != null
            && (script as ScriptBase).manifest.type === "plugin";
    }
}
