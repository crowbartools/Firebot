import { ScriptBase, LegacyCustomScript, InstalledPluginConfig, LegacyScriptReturnObject, ScriptDetails, FirebotParameterArray, ParametersConfig, ParametersWithNameConfig } from "../../../types";
import { IPluginExecutor, ScriptExecutionResult } from "./script-executor.interface";
import { buildRunRequest } from "../../common/handlers/custom-scripts/custom-script-helpers";
import { wait } from "../../utils";

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

        return true;
    }

    async executePlugin(script: ScriptBase | LegacyCustomScript, config: InstalledPluginConfig<{ legacyParams: Record<string, unknown> }>): Promise<ScriptExecutionResult> {
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

        const parametersDefinition = script.getDefaultParameters?.() ?? {};

        const parameters = Object.entries(parametersDefinition).reduce((acc, [key, value]) => {
            acc[key] = config.parameters?.legacyParams?.[key] ?? value?.default;
            return acc;
        }, {} as Record<string, unknown>);

        const runRequest = buildRunRequest(manifest, parameters, {});

        // wait for script to finish for a maximum of 10 secs
        let response: LegacyScriptReturnObject | undefined = undefined;
        try {
            response = (await Promise.race([
                Promise.resolve(script.run(runRequest as any)),
                wait(10 * 1000)
            ])) as LegacyScriptReturnObject | undefined;
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

    async getScriptDetails(
        script: ScriptBase | LegacyCustomScript
    ): Promise<ScriptDetails> {
        // this is mainly for type checking
        if (!this.isLegacyScript(script)) {
            return null;
        }

        const manifest = await script.getScriptManifest();

        const parametersObject = script.getDefaultParameters?.() ?? {};

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parametersArray: FirebotParameterArray<Record<string, unknown>> = Object.entries(parametersObject).map(([key, value]) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return {
                ...value,
                name: key
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any;
        });

        return {
            manifest: {
                version: manifest.version,
                author: manifest.author,
                name: manifest.name,
                description: manifest.description,
                website: manifest.website,
                type: "plugin"
            },
            parametersSchema: parametersArray
        };
    }

    private isLegacyScript(script: ScriptBase | LegacyCustomScript): script is LegacyCustomScript {
        return (script as ScriptBase).manifest == null;
    }
}