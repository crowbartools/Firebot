import { InstalledPluginConfig, LegacyCustomScript, Plugin, ScriptBase, ScriptContext } from "../../types/plugins";
import { ProfileManager } from "../common/profile-manager";
import path from "path";
import logger from "../logwrapper";
import frontendCommunicator from "../common/frontend-communicator";
import { PluginExecutor } from "./executors/plugin-executor";
import { LegacyStartUpScript } from "./executors/legacy-startup-script-executor";
import { IEffectScriptExecutor, IPluginExecutor, ScriptExecutionResult } from "./executors/script-executor.interface";
import { buildScriptApi } from "./script-api-factory";
import { SettingsManager } from "../common/settings-manager";
import { PluginConfigManager } from "./plugin-config-manager";

class ScriptRunner {
    private activePlugins: Record<string, Plugin | LegacyCustomScript> = {};

    private pluginExecutors: IPluginExecutor[] = [
        new PluginExecutor(),
        new LegacyStartUpScript()
    ];

    private effectScriptExecutors: IEffectScriptExecutor[] = [];

    constructor() {
        this.installRequireInterceptor();
    }

    async startPlugin(pluginConfig: InstalledPluginConfig, installing?: boolean): Promise<void> {
        if (pluginConfig.enabled === false) {
            return;
        }

        const scriptsFolder = ProfileManager.getPathInProfile("/scripts");
        const scriptFilePath = path.resolve(scriptsFolder, pluginConfig.fileName);

        const script = this.loadScript(scriptFilePath);

        if (!script) {
            return;
        }

        const checkIsCorrectType = (s: ScriptBase | LegacyCustomScript): s is Plugin | LegacyCustomScript => {
            return (s as Plugin).manifest == null || (s as Plugin).manifest.type === "plugin";
        };

        if (!checkIsCorrectType(script)) {
            logger.warn(`Script ${pluginConfig.fileName} is not a valid plugin.`);
            delete require.cache[require.resolve(scriptFilePath)];
            return;
        }

        let result: ScriptExecutionResult | undefined = undefined;
        for (const executor of this.pluginExecutors) {
            if (await executor.canHandle(script)) {
                try {
                    result = await executor.executePlugin(script, pluginConfig, installing);
                } catch (error) {
                    result = {
                        success: false,
                        error: error.message
                    };
                }
                break;
            }
        }

        if (result && result.success === true) {
            this.activePlugins[pluginConfig.id] = script;
        } else {
            if (!result) {
                logger.warn(`No executor found for script ${pluginConfig.fileName}.`);
            } else if (result?.success === false) {
                logger.warn(`Could not start plugin ${pluginConfig.fileName}: ${result.error}`);
            }
            delete require.cache[require.resolve(scriptFilePath)];
        }
    }

    async startPlugins(): Promise<void> {
        const pluginConfigs = PluginConfigManager.getAllItems();
        for (const pluginConfig of pluginConfigs) {
            if (pluginConfig.enabled) {
                logger.info(`Starting plugin ${pluginConfig.fileName}`);
                await this.startPlugin(pluginConfig, true);
            }
        }
        logger.info("All plugins started");
    }

    private installRequireInterceptor() {
        const nodeModule = require('module');
        const originalLoad = nodeModule._load;
        nodeModule._load = function load(request: string, parent?: { exports: ScriptBase | LegacyCustomScript }, isMain?: boolean) {
            if (request !== 'firebot') {
                // eslint-disable-next-line prefer-rest-params
                return originalLoad.apply(this, arguments);
            }

            const isLegacyScript = (script: ScriptBase | LegacyCustomScript): script is LegacyCustomScript => {
                return (script as ScriptBase)?.manifest == null;
            };

            if (!parent || isLegacyScript(parent.exports)) {
                // return an empty object if the script is a legacy script as is it not supported
                return {};
            }

            return buildScriptApi(parent.exports.manifest);
        };
    }

    private loadScript(scriptFilePath: string): ScriptBase | LegacyCustomScript | null {
        let customScript: ScriptBase | LegacyCustomScript | undefined = undefined;
        try {
            // Make sure we first remove the cached version, incase there was any changes
            if (SettingsManager.getSetting("ClearCustomScriptCache")) {
                delete require.cache[require.resolve(scriptFilePath)];
            }

            customScript = require(scriptFilePath);
        } catch (error) {
            frontendCommunicator.send("error", `Error loading the script '${scriptFilePath}' \n\n ${error}`);
            logger.error(error);
            return null;
        }

        return customScript;
    }
}

const scriptRunner = new ScriptRunner();

export default scriptRunner;