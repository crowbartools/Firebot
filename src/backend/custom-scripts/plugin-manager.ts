import { InstalledPluginConfig } from "../../types/plugins.js";
import frontendCommunicator from "../common/frontend-communicator.js";
import JsonDbManager from "../database/json-db-manager.js";
import profileManager from "../common/profile-manager.js";
import logger from "../logwrapper.js";

/**
 * Manages installed plugins (formerly known as "start up scripts")
 */
class PluginManager extends JsonDbManager<InstalledPluginConfig> {
    constructor() {
        super("Plugin", "/plugins");
    }

    loadItems(): void {
        this.migrateLegacyStartUpScriptsToPlugins();
        super.loadItems();
    }

    migrateLegacyStartUpScriptsToPlugins() {
        if (!profileManager.profileDataPathExistsSync("startup-scripts-config.json")) {
            return;
        }

        const startUpScriptsDb = profileManager
            .getJsonDbInProfile("startup-scripts-config");

        const startupScriptsData: Record<string, {
            id: string;
            name: string;
            scriptName: string;
            parameters: Record<string, { value: string }>
        }> | undefined = startUpScriptsDb.getData("/");

        logger.info("Migrating start up scripts to plugins");

        if (startupScriptsData) {
            for (const script of Object.values(startupScriptsData)) {
                this.saveItem({
                    id: script.id,
                    fileName: script.scriptName,
                    enabled: true,
                    legacyImport: true,
                    parameters: Object.entries(script.parameters).reduce((acc, [key, value]) => {
                        acc.legacyParams[key] = value.value;
                        return acc;
                    }, { legacyParams: {} })
                });
            }
        }

        logger.info("Deleting start up scripts database");

        profileManager.deletePathInProfile("startup-scripts-config.json");

        logger.info("Start up scripts migration complete");
    }
}

const manager = new PluginManager();

frontendCommunicator.onAsync("plugin-manager:get-all-configs", async () =>
    manager.getAllItems()
);

frontendCommunicator.onAsync("plugin-manager:save-config", async (pluginConfig: InstalledPluginConfig) =>
    manager.saveItem(pluginConfig)
);

frontendCommunicator.on("plugin-manager:delete", (pluginConfigId: string) =>
    manager.deleteItem(pluginConfigId)
);

export = manager;
