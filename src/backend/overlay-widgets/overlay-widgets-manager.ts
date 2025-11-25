import { OverlayWidgetConfig, OverlayWidgetType, WidgetEventHandler, WidgetEventResult, WidgetUIAction } from "../../types/overlay-widgets";
import { TypedEmitter } from "tiny-typed-emitter";
import frontendCommunicator from "../common/frontend-communicator";
import overlayWidgetConfigManager from "./overlay-widget-config-manager";
import websocketServerManager from "../../server/websocket-server-manager";
import { wait } from "../utils";
import logger from "../logwrapper";
import { ResourceTokenManager } from "../resource-token-manager";

type Events = {
    "overlay-widget-type-registered": (overlayWidgetType: OverlayWidgetType) => void;
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
        websocketServerManager.refreshAllOverlays();
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
                eventHandler: w.overlayExtension.eventHandler,
                onInitialLoad: w.overlayExtension.onInitialLoad
            }));
    }

    async sendWidgetEventToOverlay<EventName extends WidgetOverlayEvent["name"]>(eventName: EventName, widgetConfig: OverlayWidgetConfig, messageInfo: EventName extends "message" ? { messageName: string, messageData?: unknown } : undefined = undefined, previewMode = false) {
        const widgetType = this.getOverlayWidgetType(widgetConfig.type);
        if (!widgetType) {
            logger.warn(`Overlay widget type with ID '${widgetConfig.type}' not found for widget ID '${widgetConfig.id}'.`);
            return;
        }

        const handleWidgetEvent = async (handler: WidgetEventHandler<typeof widgetConfig["settings"], typeof widgetConfig["state"], unknown>) => {
            const result = await handler({
                ...widgetConfig,
                previewMode
            });

            const isWidgetEventResult = (obj: unknown): obj is WidgetEventResult<typeof widgetConfig["state"]> => {
                return obj != null && typeof obj === "object" && "newState" in obj;
            };

            if (isWidgetEventResult(result) && result.newState) {
                widgetConfig.state = result.newState;
                if (result.persistState) {
                    overlayWidgetConfigManager.setWidgetStateById(widgetConfig.id, widgetConfig.state);
                }
            }
        };

        if (eventName === "show" && widgetType.onShow) {
            await handleWidgetEvent(widgetType.onShow);
        } else if (eventName === "settings-update" && widgetType.onSettingsUpdate) {
            await handleWidgetEvent(widgetType.onSettingsUpdate);
        } else if (eventName === "remove" && widgetType.onRemove) {
            await handleWidgetEvent(widgetType.onRemove);
        }

        const resourceTokens = {} as Record<string, string>;
        if (!!widgetType.resourceKeys?.length) {
            for (const key of widgetType.resourceKeys) {
                const value = widgetConfig.settings[key];
                if (typeof value === "string") {
                    resourceTokens[key] = ResourceTokenManager.storeResourcePath(value, 30);
                }
            }
        }

        websocketServerManager.sendWidgetEventToOverlay({
            name: eventName,
            data: {
                widgetConfig: {
                    ...widgetConfig,
                    resourceTokens
                },
                widgetType,
                previewMode,
                ...messageInfo
            }
        });
    }

    private formatForFrontend(overlayWidgetType: OverlayWidgetType): Pick<OverlayWidgetType, "id" | "name" | "icon" | "description" | "settingsSchema" | "userCanConfigure" | "supportsLivePreview" | "initialState" | "initialAspectRatio" | "nonEditableSettings"> & { uiActions?: Omit<WidgetUIAction, "click">[] } {
        return {
            id: overlayWidgetType.id,
            name: overlayWidgetType.name,
            description: overlayWidgetType.description,
            icon: overlayWidgetType.icon,
            settingsSchema: overlayWidgetType.settingsSchema,
            nonEditableSettings: overlayWidgetType.nonEditableSettings,
            userCanConfigure: overlayWidgetType.userCanConfigure,
            supportsLivePreview: overlayWidgetType.supportsLivePreview ?? false,
            initialState: overlayWidgetType.initialState,
            initialAspectRatio: overlayWidgetType.initialAspectRatio,
            uiActions: overlayWidgetType.uiActions?.map(a => ({
                id: a.id,
                label: a.label,
                icon: a.icon
            }))
        };
    }
}

const manager = new OverlayWidgetsManager();

frontendCommunicator.on("overlay-widgets:get-all-types",
    () => manager.getOverlayWidgetTypesForFrontend()
);

frontendCommunicator.on("overlay-widgets:get-state-displays", () => {
    const configs = overlayWidgetConfigManager.getAllItems();
    return configs.reduce((acc, config) => {
        const type = manager.getOverlayWidgetType(config.type);
        if (type?.stateDisplay) {
            const display = type.stateDisplay(config);
            if (display) {
                acc[config.id] = display;
            }
        }
        return acc;
    }, {} as Record<string, string>);
});

overlayWidgetConfigManager.on("widget-config-active-changed", (config) => {
    if (config.active === false) {
        void manager.sendWidgetEventToOverlay("remove", config);
    } else {
        void manager.sendWidgetEventToOverlay("show", config);
    }
});

let livePreviewWidgetConfig: OverlayWidgetConfig | null = null;

const removeCurrentLivePreview = async () => {
    if (livePreviewWidgetConfig) {
        void manager.sendWidgetEventToOverlay("remove", livePreviewWidgetConfig, undefined, true);
        livePreviewWidgetConfig = null;
        await wait(100);
    }
};

const sendStateDisplayToFrontend = (config: OverlayWidgetConfig) => {
    const type = manager.getOverlayWidgetType(config.type);
    if (type?.stateDisplay) {
        const display = type.stateDisplay(config);
        frontendCommunicator.send("overlay-widgets:state-display-updated", {
            widgetId: config.id,
            stateDisplay: display
        });
    }
};

overlayWidgetConfigManager.on("widget-state-updated", (config, previousState, persisted) => {
    sendStateDisplayToFrontend(config);

    const widgetType = manager.getOverlayWidgetType(config.type);
    if (widgetType?.onStateUpdate) {
        void widgetType.onStateUpdate({
            ...config,
            previewMode: false,
            previousState,
            persisted
        });
    }

    if (livePreviewWidgetConfig && livePreviewWidgetConfig.id === config.id) {
        return;
    }
    if (config.active === false) {
        return;
    }
    void manager.sendWidgetEventToOverlay("state-update", config);
});

overlayWidgetConfigManager.on("created-item", async (config) => {
    sendStateDisplayToFrontend(config);

    if (livePreviewWidgetConfig && livePreviewWidgetConfig.id === config.id) {
        await removeCurrentLivePreview();
    }
    if (config.active === false) {
        return;
    }
    void manager.sendWidgetEventToOverlay("show", config);
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
        void manager.sendWidgetEventToOverlay("remove", previous);
        void manager.sendWidgetEventToOverlay("show", config);
        return;
    }
    void manager.sendWidgetEventToOverlay(shouldShow ? "show" : "settings-update", config);
});

overlayWidgetConfigManager.on("widget-config-removed", async (config) => {
    if (livePreviewWidgetConfig && livePreviewWidgetConfig.id === config.id) {
        await removeCurrentLivePreview();
    }
    if (config.active === false) {
        return;
    }
    void manager.sendWidgetEventToOverlay("remove", config);
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

    void manager.sendWidgetEventToOverlay(isNew ? "show" : "settings-update", livePreviewWidgetConfig, undefined, true);
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

    if (config?.id) {
        const existingConfig = overlayWidgetConfigManager.getItem(config.id);
        if (existingConfig && existingConfig.active !== false) {
            void manager.sendWidgetEventToOverlay("show", existingConfig);
        }
    }
});

frontendCommunicator.on("overlay-widgets:trigger-ui-action", async (data: { widgetId: string, actionId: string }) => {
    const config = overlayWidgetConfigManager.getItem(data.widgetId);
    if (!config) {
        logger.warn(`Overlay widget config with ID '${data.widgetId}' not found for UI action.`);
        return;
    }
    const type = manager.getOverlayWidgetType(config.type);
    if (!type) {
        logger.warn(`Overlay widget type with ID '${config.type}' not found for UI action on widget ID '${data.widgetId}'.`);
        return;
    }
    const action = type.uiActions?.find(a => a.id === data.actionId);
    if (!action) {
        logger.warn(`UI action with ID '${data.actionId}' not found on widget type '${type.id}' for widget ID '${data.widgetId}'.`);
        return;
    }
    if (!action.click) {
        logger.warn(`UI action with ID '${data.actionId}' on widget type '${type.id}' does not have a click handler.`);
        return;
    }

    try {
        const result = await action.click(config);
        if (result && result.newState !== undefined) {
            overlayWidgetConfigManager.setWidgetStateById(config.id, result.newState);
        }
    } catch (error) {
        logger.error(`Error occurred while triggering UI action '${data.actionId}' on widget ID '${data.widgetId}':`, error);
    }
});

websocketServerManager.on("overlay-connected", (instanceName: string = "Default") => {
    const widgetConfigs = overlayWidgetConfigManager
        .getAllItems()
        .filter(w => w.active !== false && (
            (!w.overlayInstance && instanceName === "Default") ||
            w.overlayInstance === instanceName)
        );

    for (const widgetConfig of widgetConfigs) {
        void manager.sendWidgetEventToOverlay("show", widgetConfig);
    }

    if (livePreviewWidgetConfig) {
        void manager.sendWidgetEventToOverlay("show", livePreviewWidgetConfig, undefined, true);
    }
});

websocketServerManager.on("overlay-event", (event: { name: string, data: unknown }) => {
    if (event.name !== "overlay-widget-message") {
        return;
    }
    const data = event.data as { widgetConfigId: string, messageName: string, messageData?: unknown };
    const config = overlayWidgetConfigManager.getItem(data.widgetConfigId);
    if (!config) {
        logger.warn(`Overlay widget config with ID '${data.widgetConfigId}' not found for overlay message.`);
        return;
    }
    const type = manager.getOverlayWidgetType(config.type);
    if (!type) {
        logger.warn(`Overlay widget type with ID '${config.type}' not found for overlay message on widget ID '${data.widgetConfigId}'.`);
        return;
    }
    if (type.onOverlayMessage) {
        void type.onOverlayMessage(config, data.messageName, data.messageData);
    }
});


export = manager;