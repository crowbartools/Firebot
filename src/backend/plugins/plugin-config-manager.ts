import { InstalledPluginConfig } from "../../types/plugins";
import frontendCommunicator from "../common/frontend-communicator";
import JsonDbManager from "../database/json-db-manager";

/**
 * Manages installed plugins (previously known as "start up scripts")
 */
class PluginConfigManager extends JsonDbManager<InstalledPluginConfig> {
    constructor() {
        super("Plugin", "/plugins", "Plugins");

        // eslint-disable-next-line @typescript-eslint/require-await
        frontendCommunicator.onAsync("plugin-manager:get-all-configs", async () =>
            this.getAllItems()
        );
    }
}

const manager = new PluginConfigManager();

export { manager as PluginConfigManager };