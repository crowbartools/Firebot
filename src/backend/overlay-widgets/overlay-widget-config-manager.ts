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
        super("Overlay Widget", "/overlay-widgets", "Overlay Widgets");

        frontendCommunicator.onAsync("overlay-widgets:ui-service-ready",
            async () => this.triggerUiRefresh()
        );

        frontendCommunicator.onAsync("overlay-widgets:save-config", async (config: OverlayWidgetConfig) => {
            const existing = this.getItem(config.id);
            if (existing) {
                config.state = existing.state;
            }
            return this.saveWidgetConfig(config);
        });

        frontendCommunicator.onAsync("overlay-widgets:save-new-config",
            async (config: OverlayWidgetConfig) => this.saveWidgetConfig(config, true)
        );

        frontendCommunicator.on("overlay-widgets:save-all-configs",
            (configs: OverlayWidgetConfig[]) => this.saveAllItems(configs)
        );

        frontendCommunicator.on("overlay-widgets:delete-config", (configId: string) =>
            this.removeWidgetConfigById(configId)
        );
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
        this.logger.debug("Triggering widget config UI refresh");
        frontendCommunicator.send("overlay-widgets:configs-updated", this.getAllItems());
    }
}

const manager = new OverlayWidgetConfigManager();

export = manager;