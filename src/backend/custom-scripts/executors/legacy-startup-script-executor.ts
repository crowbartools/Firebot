import { ScriptBase, LegacyCustomScript, InstalledPluginConfig, LegacyScriptReturnObject } from "../../../types/plugins";
import { IPluginExecutor, ScriptExecutionResult } from "./script-executor.interface";
import { buildRunRequest } from "../../common/handlers/custom-scripts/custom-script-helpers";
import utils from "../../utility";

export class LegacyStartUpScript extends IPluginExecutor {
    constructor() {
        super();
    }

    async canHandle(script: ScriptBase | LegacyCustomScript) {
        if (!this.isLegacyScript(script)) {
            return false;
        }

        if (script.getScriptManifest == null || typeof script.getScriptManifest !== "function") {
            return false;
        }

        const manifest = await script.getScriptManifest();

        if (manifest == null) {
            return false;
        }

        return manifest.startupOnly === true;
    }

    async executePlugin(script: ScriptBase | LegacyCustomScript, config: InstalledPluginConfig): Promise<ScriptExecutionResult> {
        // this is mainly for type checking
        if (!this.isLegacyScript(script)) {
            return {
                success: false,
                error: "Invalid script type"
            };
        }

        // Verify the script contains the "run" function
        if (typeof script.run !== "function") {
            return {
                success: false,
                error: "Script does not contain an exported 'run' function."
            };
        }

        const manifest = await script.getScriptManifest();

        const parametersDefinition = script.getDefaultParameters();

        const parameters = Object.entries(parametersDefinition).reduce((acc, [key, value]) => {
            acc[key] = config.parameters?.[key] ?? value?.default;
            return acc;
        }, {} as Record<string, unknown>);

        const runRequest = buildRunRequest(manifest, parameters, {});

        // wait for script to finish for a maximum of 10 secs
        let response: LegacyScriptReturnObject | undefined = undefined;
        try {
            response = await Promise.race([
                Promise.resolve(script.run(runRequest as any)),
                utils.wait(10 * 1000)
            ]);
        } catch (error) {
            return {
                success: false,
                error: `Error while running script '${config.fileName}'`
            };
        }

        if (response == null || typeof response !== "object") {
            return {
                success: true
            };
        }

        if (!response.success) {
            return {
                success: false,
                error: response.errorMessage
            };
        }

        return {
            success: true
        };
    }

    async unloadPlugin(script: ScriptBase | LegacyCustomScript) {
        if (!this.isLegacyScript(script)) {
            return;
        }

        if (script.stop != null && typeof script.stop === "function") {
            await script.stop();
        }
    }

    private isLegacyScript(script: ScriptBase | LegacyCustomScript): script is LegacyCustomScript {
        return (script as ScriptBase).manifest == null;
    }
}