import { OverlayWidgetConfig } from "../../types/overlay-widgets";
import JsonDbManager from "../database/json-db-manager";
import frontendCommunicator from "../common/frontend-communicator";
import { simpleClone } from "../utils";

type ExtraEvents = {
    "widget-config-updated": (item: OverlayWidgetConfig, previous: OverlayWidgetConfig) => void;
    "widget-state-updated": (item: OverlayWidgetConfig, previousState: OverlayWidgetConfig["state"], persisted: boolean) => void;
    "widget-config-active-changed": (item: OverlayWidgetConfig) => void;
    "widget-config-removed": (item: OverlayWidgetConfig) => void;
};

class OverlayWidgetConfigManager extends JsonDbManager<OverlayWidgetConfig, ExtraEvents> {
    constructor() {
        super("Overlay Widgets", "/overlay-widgets");
    }

    saveWidgetConfig(config: OverlayWidgetConfig, isNew = false): OverlayWidgetConfig {
        if (isNew) {
            return this.saveItem(config, true);
        }

        const existingConfig = simpleClone(this.getItem(config.id));

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

    getConfigsOfType<Config extends OverlayWidgetConfig = OverlayWidgetConfig>(typeId: string): Config[] {
        return this.getAllItems().filter(c => c.type === typeId) as Config[];
    }

    getWidgetStateById<State = Record<string, unknown>>(id: string): State | null {
        const config = this.getItem(id);
        return ((config?.state ?? null) as unknown as State | null);
    }

    setWidgetStateById<State extends Record<string, unknown> = Record<string, unknown>>(id: string, state: State, persist = true): void {
        const config = this.getItem(id);
        if (!config) {
            return;
        }
        this.emit("widget-state-updated", {
            ...config,
            state
        }, config.state, persist);
        if (persist) {
            config.state = state;
            this.saveItem(config, false, true);
        }
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("overlay-widgets:configs-updated");
    }
}

const manager = new OverlayWidgetConfigManager();

frontendCommunicator.on("overlay-widgets:get-all-configs",
    () => manager.getAllItems()
);

frontendCommunicator.on("overlay-widgets:save-config", (config: OverlayWidgetConfig) => {
    const existing = manager.getItem(config.id);
    if (existing) {
        config.state = existing.state;
    }
    return manager.saveWidgetConfig(config);
});

frontendCommunicator.on("overlay-widgets:save-new-config",
    (config: OverlayWidgetConfig) => manager.saveWidgetConfig(config, true)
);

frontendCommunicator.on("overlay-widgets:save-all-configs",
    (configs: OverlayWidgetConfig[]) => manager.saveAllItems(configs)
);

frontendCommunicator.on("overlay-widgets:delete-config", (configId: string) =>
    manager.removeWidgetConfigById(configId)
);

export = manager;