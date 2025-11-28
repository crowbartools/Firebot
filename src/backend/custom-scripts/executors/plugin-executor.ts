import { ScriptBase, LegacyCustomScript, Plugin, ScriptContext, InstalledPluginConfig, ScriptDetails } from "../../../types";
import { IPluginExecutor, ScriptExecutionResult } from "./script-executor.interface";
import { EffectManager } from "../../effects/effect-manager";

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
            parametersSchema: script.parametersSchema
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

                EffectManager.registerEffect(effect);
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
        return script.parametersSchema.reduce((acc, param) => {
            if (config.parameters && config.parameters.hasOwnProperty(param.name)) {
                acc[param.name] = config.parameters[param.name];
            } else if (param.default != null) {
                acc[param.name] = param.default;
            }
            return acc;
        }, {} as Record<string, unknown>);
    }

    private isPlugin(script: ScriptBase | LegacyCustomScript): script is Plugin {
        return (script as ScriptBase).manifest != null && (script as ScriptBase).manifest.type === "plugin";
    }
}
