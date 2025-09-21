import { OverlayWidgetConfig, OverlayWidgetType } from "../../types/overlay-widgets";
import { TypedEmitter } from "tiny-typed-emitter";
import frontendCommunicator from "../common/frontend-communicator";
import overlayWidgetConfigManager from "./overlay-widget-config-manager";
import websocketServerManager from "../../server/websocket-server-manager";

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

    sendWidgetEventToOverlay(eventName: WidgetOverlayEvent["name"], widgetConfig: OverlayWidgetConfig) {
        const widgetType = this.getOverlayWidgetType(widgetConfig.type);
        if (!widgetType) {
            console.warn(`Overlay widget type with ID '${widgetConfig.type}' not found for widget ID '${widgetConfig.id}'.`);
            return;
        }
        websocketServerManager.sendWidgetEventToOverlay({
            name: eventName,
            data: {
                widgetConfig,
                widgetType
            }
        });
    }

    private formatForFrontend(overlayWidgetType: OverlayWidgetType): Pick<OverlayWidgetType, "id" | "name" | "icon" | "description" | "settingsSchema" | "userCanConfigure"> {
        return {
            id: overlayWidgetType.id,
            name: overlayWidgetType.name,
            description: overlayWidgetType.description,
            icon: overlayWidgetType.icon,
            settingsSchema: overlayWidgetType.settingsSchema,
            userCanConfigure: overlayWidgetType.userCanConfigure
        };
    }
}

const manager = new OverlayWidgetsManager();

frontendCommunicator.onAsync("overlay-widgets:get-all-types", async () => {
    return manager.getOverlayWidgetTypesForFrontend();
});

overlayWidgetConfigManager.on("created-item", (config) => {
    if (config.active === false) {
        return;
    }
    manager.sendWidgetEventToOverlay("show", config);
});

overlayWidgetConfigManager.on("widget-config-updated", (config) => {
    if (config.active === false) {
        return;
    }
    manager.sendWidgetEventToOverlay("settings-update", config);
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

overlayWidgetConfigManager.on("widget-config-removed", (config) => {
    manager.sendWidgetEventToOverlay("remove", config);
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
});

export = manager;