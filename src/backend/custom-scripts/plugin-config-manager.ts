import { InstalledPluginConfig } from "../../types/plugins.js";
import frontendCommunicator from "../common/frontend-communicator.js";
import JsonDbManager from "../database/json-db-manager.js";
import { ProfileManager } from "../common/profile-manager.js";
import logger from "../logwrapper.js";

/**
 * Manages installed plugins (formerly known as "start up scripts")
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
        if (!ProfileManager.profileDataPathExistsSync("startup-scripts-config.json")) {
            return;
        }

        const startUpScriptsDb = ProfileManager
            .getJsonDbInProfile("startup-scripts-config");

        const startupScriptsData: Record<string, {
            id: string;
            name: string;
            scriptName: string;
            parameters?: Record<string, { value: string }>;
        }> | undefined = startUpScriptsDb.getData("/");

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

        logger.info("Deleting start up scripts database");

        ProfileManager.deletePathInProfile("startup-scripts-config.json");

        logger.info("Start up scripts migration complete");
    }
}

const manager = new PluginConfigManager();

frontendCommunicator.onAsync("plugin-manager:get-all-configs", async () =>
    manager.getAllItems()
);

frontendCommunicator.onAsync("plugin-manager:save-config", async (pluginConfig: InstalledPluginConfig) => {
    const saved = manager.saveItem(pluginConfig);
    try {
        // lazy require to avoid circular import with script-manager

        const scriptManager = require("./script-manager").default;
        await scriptManager.reloadPluginConfig(pluginConfig);
    } catch (error) {
        logger.error("Error reloading plugin after config save", error);
    }
    return saved;
});

frontendCommunicator.onAsync("plugin-manager:delete", async (pluginConfigId: string) => {
    const existing = manager.getItem(pluginConfigId);
    manager.deleteItem(pluginConfigId);
    if (existing) {
        try {

            const scriptManager = require("./script-manager").default;
            await scriptManager.onPluginConfigDeleted(existing);
        } catch (error) {
            logger.error("Error during plugin uninstall cleanup", error);
        }
    }
    return true;
});

export { manager as PluginConfigManager };
