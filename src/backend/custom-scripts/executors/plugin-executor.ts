import { ScriptBase, LegacyCustomScript, Plugin, ScriptContext, InstalledPluginConfig } from "../../../types/plugins";
import { IPluginExecutor, ScriptDetails, ScriptExecutionResult } from "./script-executor.interface";
import effectManager from "../../effects/effectManager";

export class PluginExecutor extends IPluginExecutor {
    constructor() {
        super();
    }

    canHandle(script: ScriptBase | LegacyCustomScript) {
        return this.isPlugin(script);
    }

    async getScriptDetails(script: ScriptBase | LegacyCustomScript): Promise<ScriptDetails> {
        // this is mainly for type checking
        if (!this.isPlugin(script)) {
            return null;
        }

        return {
            manifest: script.manifest,
            parameters: script.parameters
        };
    }

    async executePlugin(
        script: ScriptBase | LegacyCustomScript,
        config: InstalledPluginConfig,
        isInstalling?: boolean
    ): Promise<ScriptExecutionResult> {
        // this is mainly for type checking
        if (!this.isPlugin(script)) {
            return {
                success: false,
                error: "Invalid script type"
            };
        }

        const context: ScriptContext = {
            parameters: this.buildParameters(script, config)
        };

        if (script.registers) {
            script.registers.effects?.forEach(async (effectOrAwaitableEffect) => {
                const effect =
                    typeof effectOrAwaitableEffect === "function"
                        ? await effectOrAwaitableEffect(context)
                        : effectOrAwaitableEffect;

                effectManager.registerEffect(effect);
            });

            // TODO: Implement other register types
        }

        await script.onLoad?.(context, isInstalling);

        return {
            success: true
        };
    }

    async unloadPlugin(
        script: ScriptBase | LegacyCustomScript,
        config: InstalledPluginConfig,
        isUninstalling?: boolean
    ): Promise<void> {
        // this is mainly for type checking
        if (!this.isPlugin(script)) {
            return;
        }

        const context: ScriptContext = {
            parameters: this.buildParameters(script, config)
        };

        await script.onUnload?.(context, isUninstalling);
    }

    private buildParameters(script: Plugin, config: InstalledPluginConfig) {
        return Object.entries(script.parameters).reduce((acc, [categoryKey, category]) => {
            acc[categoryKey] = Object.entries(category.settings).reduce((subAcc, [paramKey, param]) => {
                subAcc[paramKey] = config.parameters?.[categoryKey]?.[paramKey] ?? param?.default;
                return subAcc;
            }, {} as Record<string, unknown>);
            return acc;
        }, {} as Record<string, Record<string, unknown>>);
    }

    private isPlugin(script: ScriptBase | LegacyCustomScript): script is Plugin {
        return (script as ScriptBase).manifest != null && (script as ScriptBase).manifest.type === "plugin";
    }
}
