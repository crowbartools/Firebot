import { ScriptBase, LegacyCustomScript, Plugin, ScriptContext, InstalledPluginConfig } from "../../../types/plugins";
import { IPluginExecutor, ScriptExecutionResult } from "./script-executor.interface";
import effectManager from "../../effects/effectManager";

export class PluginExecutor extends IPluginExecutor {
    constructor() {
        super();
    }

    canHandle(script: ScriptBase | LegacyCustomScript) {
        return this.isPlugin(script);
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

        const parameters = Object.entries(script.parameters).reduce((acc, [key, value]) => {
            acc[key] = config.parameters?.[key] ?? value?.default;
            return acc;
        }, {} as Record<string, unknown>);

        const context: ScriptContext = {
            parameters
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

    private isPlugin(script: ScriptBase | LegacyCustomScript): script is Plugin {
        return (script as ScriptBase).manifest != null && (script as ScriptBase).manifest.type === "plugin";
    }
}
