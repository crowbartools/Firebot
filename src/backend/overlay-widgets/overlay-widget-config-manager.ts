import { OverlayWidgetConfig } from "../../types/overlay-widgets";
import JsonDbManager from "../database/json-db-manager";
import frontendCommunicator from "../common/frontend-communicator";

type ExtraEvents = {
    "widget-config-updated": (item: OverlayWidgetConfig, previous: OverlayWidgetConfig) => void;
    "widget-state-updated": (item: OverlayWidgetConfig) => void;
    "widget-config-active-changed": (item: OverlayWidgetConfig) => void;
    "widget-config-removed": (item: OverlayWidgetConfig) => void;
}

class OverlayWidgetConfigManager extends JsonDbManager<OverlayWidgetConfig, ExtraEvents> {
    constructor() {
        super("Overlay Widgets", "/overlay-widgets");
    }

    saveWidgetConfig(config: OverlayWidgetConfig, isNew = false): OverlayWidgetConfig {
        if (isNew) {
            return this.saveItem(config, true);
        }

        const existingConfig = JSON.parse(JSON.stringify(this.getItem(config.id))) as OverlayWidgetConfig;

        const ifActiveChanged = (existingConfig.active ?? true) !== (config.active ?? true);

        if (ifActiveChanged) {
            this.emit("widget-config-active-changed", config);
        } else {
            this.emit("widget-config-updated", config, existingConfig);
        }

        return this.saveItem(config, false);
    }

    removeWidgetConfigById(id: string): boolean {
        const existingConfig = this.getItem(id);
        if (existingConfig) {
            this.emit("widget-config-removed", existingConfig);
            return this.deleteItem(id);
        }
        return false;
    }

    getWidgetStateById(id: string): OverlayWidgetConfig["state"] | null {
        const config = this.getItem(id);
        return config?.state ?? null;
    }

    setWidgetStateById(id: string, state: OverlayWidgetConfig["state"]): void {
        const config = this.getItem(id);
        if (!config) {
            return;
        }
        config.state = state;
        this.emit("widget-state-updated", config);
        this.saveItem(config);
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("overlay-widgets:configs-updated");
    }
}

const manager = new OverlayWidgetConfigManager();

frontendCommunicator.onAsync("overlay-widgets:get-all-configs", async () =>
    manager.getAllItems()
);

frontendCommunicator.onAsync("overlay-widgets:save-config", async (config: OverlayWidgetConfig) =>
    manager.saveWidgetConfig(config)
);

frontendCommunicator.onAsync("overlay-widgets:save-new-config", async (config: OverlayWidgetConfig) =>
    manager.saveWidgetConfig(config, true)
);

frontendCommunicator.onAsync(
    "overlay-widgets:save-all-configs",
    async (configs: OverlayWidgetConfig[]) => manager.saveAllItems(configs)
);

frontendCommunicator.on("overlay-widgets:delete-config", (configId: string) =>
    manager.removeWidgetConfigById(configId)
);

export = manager;