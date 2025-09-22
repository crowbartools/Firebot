import { OverlayWidgetConfig, OverlayWidgetType } from "../../types/overlay-widgets";
import { TypedEmitter } from "tiny-typed-emitter";
import frontendCommunicator from "../common/frontend-communicator";
import overlayWidgetConfigManager from "./overlay-widget-config-manager";
import websocketServerManager from "../../server/websocket-server-manager";
import { wait } from "../utility";

type Events = {
    "overlay-widget-type-registered": (overlayWidgetType: OverlayWidgetType) => void
};

class OverlayWidgetsManager extends TypedEmitter<Events> {

    private overlayWidgetTypes: Map<string, OverlayWidgetType> = new Map();

    constructor() {
        super();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerOverlayWidgetType(overlayWidgetType: OverlayWidgetType<any, any>) {
        if (this.overlayWidgetTypes.has(overlayWidgetType.id)) {
            throw new Error(`Overlay widget type with ID '${overlayWidgetType.id}' is already registered.`);
        }
        this.overlayWidgetTypes.set(overlayWidgetType.id, overlayWidgetType);
        this.emit("overlay-widget-type-registered", overlayWidgetType);
        frontendCommunicator.send("overlay-widgets:type-registered", this.formatForFrontend(overlayWidgetType));
        websocketServerManager.refreshOverlays();
    }

    getOverlayWidgetType(id: string): OverlayWidgetType | null {
        return this.overlayWidgetTypes.get(id) ?? null;
    }

    getOverlayWidgetTypesForFrontend() {
        return Array.from(this.overlayWidgetTypes.values()).map(this.formatForFrontend);
    }

    getOverlayExtensions() {
        return Array.from(this.overlayWidgetTypes.values())
            .map(w => ({
                typeId: w.id,
                dependencies: w.overlayExtension.dependencies,
                eventHandler: w.overlayExtension.eventHandler
            }));
    }

    sendWidgetEventToOverlay(eventName: WidgetOverlayEvent["name"], widgetConfig: OverlayWidgetConfig, previewMode = false) {
        const widgetType = this.getOverlayWidgetType(widgetConfig.type);
        if (!widgetType) {
            console.warn(`Overlay widget type with ID '${widgetConfig.type}' not found for widget ID '${widgetConfig.id}'.`);
            return;
        }
        websocketServerManager.sendWidgetEventToOverlay({
            name: eventName,
            data: {
                widgetConfig,
                widgetType,
                previewMode
            }
        });
    }

    private formatForFrontend(overlayWidgetType: OverlayWidgetType): Pick<OverlayWidgetType, "id" | "name" | "icon" | "description" | "settingsSchema" | "userCanConfigure" | "supportsLivePreview"> {
        return {
            id: overlayWidgetType.id,
            name: overlayWidgetType.name,
            description: overlayWidgetType.description,
            icon: overlayWidgetType.icon,
            settingsSchema: overlayWidgetType.settingsSchema,
            userCanConfigure: overlayWidgetType.userCanConfigure,
            supportsLivePreview: overlayWidgetType.supportsLivePreview ?? false
        };
    }
}

const manager = new OverlayWidgetsManager();

frontendCommunicator.onAsync("overlay-widgets:get-all-types", async () => {
    return manager.getOverlayWidgetTypesForFrontend();
});

overlayWidgetConfigManager.on("widget-state-updated", (config) => {
    if (config.active === false) {
        return;
    }
    manager.sendWidgetEventToOverlay("state-update", config);
});

overlayWidgetConfigManager.on("widget-config-active-changed", (config) => {
    if (config.active === false) {
        manager.sendWidgetEventToOverlay("remove", config);
    } else {
        manager.sendWidgetEventToOverlay("show", config);
    }
});

let livePreviewWidgetConfig: OverlayWidgetConfig | null = null;

const removeCurrentLivePreview = async () => {
    if (livePreviewWidgetConfig) {
        manager.sendWidgetEventToOverlay("remove", livePreviewWidgetConfig, true);
        livePreviewWidgetConfig = null;
        await wait(100);
    }
};

overlayWidgetConfigManager.on("created-item", async (config) => {
    if (livePreviewWidgetConfig && livePreviewWidgetConfig.id === config.id) {
        await removeCurrentLivePreview();
    }
    if (config.active === false) {
        return;
    }
    manager.sendWidgetEventToOverlay("show", config);
});

overlayWidgetConfigManager.on("widget-config-updated", async (config, previous) => {
    let shouldShow = false;
    if (livePreviewWidgetConfig && livePreviewWidgetConfig.id === config.id) {
        await removeCurrentLivePreview();
        shouldShow = true;
    }
    if (config.active === false) {
        return;
    }
    if (config.overlayInstance !== previous.overlayInstance) {
        // If the overlay instance changed, remove from the previous instance and show on the new one
        manager.sendWidgetEventToOverlay("remove", previous);
        manager.sendWidgetEventToOverlay("show", config);
        return;
    }
    manager.sendWidgetEventToOverlay(shouldShow ? "show" : "settings-update", config);
});

overlayWidgetConfigManager.on("widget-config-removed", async (config) => {
    if (livePreviewWidgetConfig && livePreviewWidgetConfig.id === config.id) {
        await removeCurrentLivePreview();
    }
    manager.sendWidgetEventToOverlay("remove", config);
});

const handleLivePreviewUpdate = async (config: OverlayWidgetConfig) => {
    const type = config.type ? manager.getOverlayWidgetType(config.type) : null;

    const typeInvalid = !type || !type.supportsLivePreview;

    let isNew = false;

    if (typeInvalid ||
        config.id !== livePreviewWidgetConfig?.id ||
        config.type !== livePreviewWidgetConfig?.type ||
        config.overlayInstance !== livePreviewWidgetConfig?.overlayInstance
    ) {
        await removeCurrentLivePreview();
        if (typeInvalid) {
            return;
        }
        isNew = true;
    }

    // Ensure config has some state
    config.state = type.livePreviewState ?? config.state ?? type.initialState ?? {};

    livePreviewWidgetConfig = config;

    manager.sendWidgetEventToOverlay(isNew ? "show" : "settings-update", livePreviewWidgetConfig, true);
};

frontendCommunicator.onAsync("overlay-widgets:start-live-preview", handleLivePreviewUpdate);

frontendCommunicator.onAsync("overlay-widgets:update-live-preview", async (config: OverlayWidgetConfig) => {
    // If there's no live preview active, ignore
    if (!livePreviewWidgetConfig) {
        return;
    }
    await handleLivePreviewUpdate(config);
});

frontendCommunicator.onAsync("overlay-widgets:stop-live-preview", async (config: OverlayWidgetConfig) => {
    await removeCurrentLivePreview();

    if (config.id) {
        const existingConfig = overlayWidgetConfigManager.getItem(config.id);
        if (existingConfig && existingConfig.active !== false) {
            manager.sendWidgetEventToOverlay("show", existingConfig);
        }
    }
});

websocketServerManager.on("overlay-connected", (instanceName: "Default" | string) => {
    const widgetConfigs = overlayWidgetConfigManager
        .getAllItems()
        .filter(w => w.active !== false && (
            (!w.overlayInstance && instanceName === "Default") ||
            w.overlayInstance === instanceName)
        );

    for (const widgetConfig of widgetConfigs) {
        manager.sendWidgetEventToOverlay("show", widgetConfig);
    }
    if (livePreviewWidgetConfig) {
        manager.sendWidgetEventToOverlay("show", livePreviewWidgetConfig, true);
    }
});


export = manager;