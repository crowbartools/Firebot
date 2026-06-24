import {
    PluginBase,
    LegacyCustomScript,
    InstalledPluginConfig,
    LegacyScriptReturnObject,
    PluginDetails,
    FirebotParameterArray
} from "../../../types";
import { IPluginExecutor, PluginExecutionResult } from "./plugin-executor.interface";
import { buildRunRequest } from "../legacy-helpers/custom-script-helpers";
import { wait } from "../../utils";
import { LoggerCache } from "../../logger-cache";
import { registerPluginLogName, unregisterPluginLogName } from "../../plugin-log-names";

const logger = LoggerCache.getLogger("Plugins");

/**
 * Executor for legacy startup scripts (scripts that export a getScriptManifest function that returns an object with startupOnly: true)
 */
export class LegacyStartUpScript extends IPluginExecutor {
    constructor() {
        super();
    }

    async canHandle(script: PluginBase | LegacyCustomScript) {
        if (!this.isLegacyScript(script)) {
            return false;
        }

        if (script.getScriptManifest == null || typeof script.getScriptManifest !== "function") {
            return false;
        }

        const manifest = await script.getScriptManifest();

        if (manifest == null || !manifest.startupOnly) {
            return false;
        }

        return true;
    }

    async executePlugin(
        script: PluginBase | LegacyCustomScript,
        config: InstalledPluginConfig
    ): Promise<PluginExecutionResult> {
        if (!this.isLegacyScript(script)) {
            return {
                success: false,
                error: "Invalid script type"
            };
        }

        if (typeof script.run !== "function") {
            return {
                success: false,
                error: "Script does not contain an exported 'run' function."
            };
        }


        const manifest = await script.getScriptManifest();
        const parameters = this.buildParameters(script, config);
        const runRequest = buildRunRequest(config.id, manifest, parameters, {});

        registerPluginLogName(config.id, manifest.name);

        let response: LegacyScriptReturnObject | undefined = undefined;
        try {
            response = (await Promise.race([
                Promise.resolve(script.run(runRequest as never)),
                wait(10 * 1000)
            ])) as LegacyScriptReturnObject | undefined;
        } catch (error) {
            logger.error(`Error while running legacy script '${config.fileName}'`, error);
            return {
                success: false,
                error: `Error while running script '${config.fileName}'`
            };
        }

        if (response == null || typeof response !== "object") {
            return { success: true };
        }

        if (!response.success) {
            return {
                success: false,
                error: response.errorMessage
            };
        }

        return { success: true };
    }

    async unloadPlugin(
        script: PluginBase | LegacyCustomScript,
        config: InstalledPluginConfig
    ) {
        if (!this.isLegacyScript(script)) {
            return;
        }

        if (typeof script.stop === "function") {
            try {
                await Promise.resolve(script.stop());
            } catch (error) {
                logger.error("Error when attempting to stop legacy custom script", error);
            }
        }

        unregisterPluginLogName(config.id);
    }

    async updateParameters(
        script: PluginBase | LegacyCustomScript,
        config: InstalledPluginConfig
    ): Promise<void> {
        if (!this.isLegacyScript(script)) {
            return;
        }

        if (typeof script.parametersUpdated === "function") {
            try {
                await Promise.resolve(script.parametersUpdated(this.buildParameters(script, config)));
            } catch (error) {
                logger.error("Error when calling parametersUpdated on legacy script", error);
            }
        }
    }

    async getPluginDetails(
        script: PluginBase | LegacyCustomScript
    ): Promise<PluginDetails> {
        if (!this.isLegacyScript(script)) {
            return null;
        }

        const manifest = await script.getScriptManifest();
        const parametersObject = script.getDefaultParameters?.() ?? {};

        const parametersArray = Object.entries(parametersObject).map(([key, value]) => ({
            ...value,
            name: key
        })) as unknown as FirebotParameterArray<Record<string, unknown>>;

        return {
            manifest: {
                version: manifest.version,
                author: manifest.author,
                name: manifest.name,
                description: manifest.description,
                website: manifest.website,
                initBeforeShowingParams: manifest.initBeforeShowingParams
            },
            parametersSchema: parametersArray
        };
    }

    private buildParameters(
        script: LegacyCustomScript,
        config: InstalledPluginConfig
    ): Record<string, unknown> {
        const parametersDefinition = script.getDefaultParameters?.() ?? {};

        return Object.entries(parametersDefinition).reduce<Record<string, unknown>>(
            (acc, [key, value]) => {
                if (config.parameters && Object.prototype.hasOwnProperty.call(config.parameters, key)) {
                    acc[key] = config.parameters[key];
                } else {
                    acc[key] = value?.default;
                }
                return acc;
            },
            {}
        );
    }

    private isLegacyScript(script: PluginBase | LegacyCustomScript): script is LegacyCustomScript {
        return (script as PluginBase).manifest == null;
    }
}
