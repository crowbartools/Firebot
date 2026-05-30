import { InstalledPluginConfig } from "../../types/plugins.js";
import frontendCommunicator from "../common/frontend-communicator.js";
import JsonDbManager from "../database/json-db-manager.js";
import { ProfileManager } from "../common/profile-manager.js";
import { SettingsManager } from "../common/settings-manager.js";
import logger from "../logwrapper.js";

/**
 * Manages installed plugins (previously known as "start up scripts")
 */
class PluginConfigManager extends JsonDbManager<InstalledPluginConfig> {
    constructor() {
        super("Plugin", "/plugins");
    }

    loadItems(): void {
        this.migrateLegacyStartUpScriptsToPlugins();
        super.loadItems();
    }

    migrateLegacyStartUpScriptsToPlugins() {
        const hasMigrated = SettingsManager.getSetting("MigratedLegacyStartUpScriptsToPlugins");
        if (hasMigrated) {
            return;
        }

        if (!ProfileManager.profileDataPathExistsSync("startup-scripts-config.json")) {
            SettingsManager.saveSetting("MigratedLegacyStartUpScriptsToPlugins", true);
            return;
        }

        const startUpScriptsDb = ProfileManager
            .getJsonDbInProfile("startup-scripts-config");


        type StartUpScriptData = Record<string, {
            id: string;
            name: string;
            scriptName: string;
            parameters?: Record<string, { value: string }>;
        }>;

        const startupScriptsData: StartUpScriptData | undefined = startUpScriptsDb.getData("/") as unknown as StartUpScriptData;

        logger.info("Migrating start up scripts to plugins");

        if (startupScriptsData) {
            for (const script of Object.values(startupScriptsData)) {
                try {
                    this.saveItem({
                        id: script.id,
                        fileName: script.scriptName,
                        enabled: true,
                        legacyImport: true,
                        parameters: Object.entries(script.parameters ?? {}).reduce<Record<string, unknown>>((acc, [paramKey, param]) => {
                            acc[paramKey] = param?.value;
                            return acc;
                        }, {})
                    });
                } catch (error) {
                    logger.error(`Failed to migrate start up script ${script.id}: ${error}`);
                }
            }
        }

        // eslint-disable-next-line no-warning-comments
        // TODO: in a future version we can uncomment the following to clean up old start up script data after migration has been out for a while

        // logger.info("Deleting start up scripts database");
        // ProfileManager.deletePathInProfile("startup-scripts-config.json");

        SettingsManager.saveSetting("MigratedLegacyStartUpScriptsToPlugins", true);

        logger.info("Start up scripts migration complete");
    }
}

const manager = new PluginConfigManager();

// eslint-disable-next-line @typescript-eslint/require-await
frontendCommunicator.onAsync("plugin-manager:get-all-configs", async () =>
    manager.getAllItems()
);

// eslint-disable-next-line @typescript-eslint/require-await
frontendCommunicator.onAsync("plugin-manager:save-config", async (pluginConfig: InstalledPluginConfig) => {
    return manager.saveItem(pluginConfig);
});

export { manager as PluginConfigManager };
