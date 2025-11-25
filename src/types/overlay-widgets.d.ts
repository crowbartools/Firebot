import type { FirebotParameterArray, FontOptions } from "./parameters";
import type { Awaitable } from "./util-types";

export type Position = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type Animation = {
    /**
     * CSS class name for the animation (e.g., from Animate.css)
     */
    class: string;
    /**
     * Custom duration in seconds
     */
    duration?: number;
};

type WidgetEvent<Settings, State> = OverlayWidgetConfig<Settings, State> & {
    previewMode: boolean;
    previousState?: State;
    persisted?: boolean;
};

export type WidgetEventResult<State> = {
    newState?: State | null;
    /**
     * If true, the new state will be persisted to file.
     * @default false
     */
    persistState?: boolean;
};

export type WidgetEventHandler<Settings, State, Return = WidgetEventResult<State>> = (event: WidgetEvent<Settings, State>) => Awaitable<Return | undefined>;

export type WidgetUIAction<
    Settings extends Record<string, unknown> = Record<string, unknown>,
    State = Record<string, unknown>
> = {
    id: string;
    label: string;
    icon: string;

    click: (config: OverlayWidgetConfig<Settings, State>) => Awaitable<{
        newState?: State | null;
    } | void>;
};

export type OverlayWidgetType<
    Settings extends Record<string, unknown> = Record<string, unknown>,
    State = Record<string, unknown>
> = {
    id: string;
    name: string;
    description: string;
    icon: string;
    userCanConfigure?: {
        /**
         * @default true
         */
        position?: boolean;
        /**
         * @default true
         */
        zIndex?: boolean;
        /**
         * @default true
         */
        entryAnimation?: boolean;
        /**
         * @default true
         */
        exitAnimation?: boolean;
    };
    /**
     * Initial aspect ratio for the widget. Used to set a default size when adding the widget.
     * @example { width: 16, height: 9 } for a 16:9 aspect ratio.
     * @default { width: 16, height: 9 } (16:9)
     */
    initialAspectRatio?: {
        width: number;
        height: number;
    };
    /**
     * Settings allow the user to customize the widget instance (e.g., font to use, colors, etc.)
     */
    settingsSchema?: FirebotParameterArray<Settings>;

    /**
     * Array of setting keys that cannot be edited in the Update Overlay Widget Settings effect.
     */
    nonEditableSettings?: (keyof Settings)[];

    /**
     * Initial state for the widget instance (e.g., current count for a counter widget)
     */
    initialState?: State;
    /**
     * Whether the widget supports live preview mode when adding or editing the widget.
     * Widget types should only enable this if all settings have default values or
     * the widget gracefully handles missing settings.
     *
     * Default is false.
     */
    supportsLivePreview?: boolean;
    /**
     * State that is used when the widget is shown in live preview mode.
     */
    livePreviewState?: State;

    /**
     * Array of setting keys that reference local resource paths.
     * These properties will be automatically converted to resource tokens when sent to the overlay,
     */
    resourceKeys?: Array<keyof Settings>;
    /**
     * Function that returns a short string representing the current state of the widget.
     * This is shown in the overlay widget list to give the user a quick overview of the widget's state.
     * If null or undefined, no state display is shown.
     */

    stateDisplay?: (config: OverlayWidgetConfig<Settings, State>) => string | null;
    /**
     * Actions are buttons shown in the overlay widget list for each widget instance.
     * They allow the user to quickly perform common actions on the widget (e.g., start or stop a countdown timer).
     */
    uiActions?: WidgetUIAction<Settings, State>[];
    /**
     * Called before the widget is shown on the overlay. You can modify state here.
     */
    onShow?: WidgetEventHandler<Settings, State>;
    /**
     * Called when the widget settings are updated. You can modify state here.
     */
    onSettingsUpdate?: WidgetEventHandler<Settings, State>;
    /**
     * Called when the widget state is updated. You can't modify state here (would cause infinite loop).
     */
    onStateUpdate?: WidgetEventHandler<Settings, State, void>;
    /**
     * Called before the widget is removed from the overlay. You can modify state here.
     */
    onRemove?: WidgetEventHandler<Settings, State>;
    /**
     * Called when the widget sends a message from the overlay.
     */
    onOverlayMessage?: (config: OverlayWidgetConfig<Settings, State>, messageName: string, messageData?: unknown) => Awaitable<void>;
    /**
     * This code is injected into the overlay. Do not reference any variables outside this scope.
     */
    overlayExtension: {
        dependencies?: {
            css?: string[];
            js?: string[];
            globalStyles?: string;
        };

        eventHandler: (event: WidgetOverlayEvent, utils: IOverlayWidgetEventUtils) => void;
        /**
         * Called when the overlay is loaded. Can be async.
         */
        onInitialLoad?: (utils: IOverlayWidgetInitUtils) => Awaitable<void>;
    };
};

type OverlayWidgetConfig<Settings = Record<string, unknown>, State = Record<string, unknown>> = {
    id: string;
    name: string;
    type: string;
    /**
     * Whether the overlay widget is active and should be rendered on the overlay.
     * Default is true.
     */
    active?: boolean;
    position: Position;
    zIndex?: number;
    /**
     * Overlay instance ID where this widget should be shown.
     * If null or undefined, the widget will be shown on the default overlay.
     */
    overlayInstance?: string | null;
    entryAnimation?: Animation | null;
    exitAnimation?: Animation | null;
    settings: Settings;
    state?: State;
};

export type WidgetOverlayEvent<Settings = Record<string, unknown>, State = Record<string, unknown>> = {
    name: "show" | "settings-update" | "state-update" | "message" | "remove";
    data: {
        widgetConfig: Pick<OverlayWidgetConfig<Settings, State>, "id" | "name" | "type" | "position" | "entryAnimation" | "exitAnimation" | "settings" | "state" | "overlayInstance" | "zIndex"> & {
            resourceTokens: {
                [K in keyof Settings]: string;
            };
        };
        widgetType: Pick<OverlayWidgetType, "id" | "userCanConfigure">;
        previewMode: boolean;
        /**
         * For "message" events, the name of the message being sent.
         */
        messageName?: string;
        /**
         * For "message" events, any data associated with the message.
         */
        messageData?: unknown;
    };
};

/**
 * Utility functions for managing overlay widgets. These functions can used within the overlayExtension.eventHandler
 */
export interface IOverlayWidgetEventUtils {
    /**
     * Automatically handles overlay events for the widget, including showing, updating, and removing the widget using the provided HTML generator function.
     *
     * @param generateWidgetHtml Function that generates the HTML for the widget based on its current configuration.
     * @param updateOnMessage If true, the widget HTML will be updated when a "message" event is received. Default is false.
     */
    handleOverlayEvent(generateWidgetHtml: (widgetConfig: WidgetOverlayEvent["data"]["widgetConfig"]) => string, updateOnMessage = false): void;
    getWidgetPositionStyle(position?: Position): string;
    getWidgetContainerElement(): HTMLElement | null;
    initializeWidget(
        html: string
    ): void;
    updateWidgetContent(
        newHtml: string,
    ): void;
    updateWidgetPosition(): void;
    removeWidget(): void;
    stylesToString(styles: Record<string, string | number | undefined>): string;
    getFontOptionsStyles(fontOptions?: FontOptions): Record<string, string | number | undefined>;
    sendMessageToFirebot(messageName: string, messageData?: unknown): void;
}

export interface IOverlayWidgetInitUtils {
    getWidgetContainerElements(): NodeListOf<HTMLElement>;
}