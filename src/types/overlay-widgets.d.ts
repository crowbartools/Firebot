import { FirebotParameterArray } from "./parameters";
import { Awaitable } from "./util-types";

export type Position = {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type Animation = {
    /**
     * CSS class name for the animation (e.g., from Animate.css)
     */
    class: string;
    /**
     * Custom duration in seconds
     */
    duration?: number;
}


type WidgetEvent<Settings, State> = {
    id: string;
    settings: Settings;
    state: State;
}

type WidgetEventResult<State> = {
    newState?: State | null;
}


export type OverlayWidgetType<Settings extends Record<string, unknown> = Record<string, unknown>, State = Record<string, unknown>> = {
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
        entryAnimation?: boolean;
        /**
         * @default true
         */
        exitAnimation?: boolean;
    },
    /**
     * Settings allow the user to customize the widget instance (e.g., font to use, colors, etc.)
     */
    settingsSchema?: FirebotParameterArray<Settings>;
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
     * Called before the widget is shown on the overlay. You can modify parameter values or state here.
     */
    onShow?: (event: WidgetEvent<Settings, State>) => Awaitable<WidgetEventResult<State> | void>;
    /**
     * Called when the widget settings are updated. You can modify parameter values or state here.
     */
    onSettingsUpdate?: (event: WidgetEvent<Settings, State>) => Awaitable<WidgetEventResult<State> | void>;
    /**
     * Called before the widget is removed from the overlay. You can modify parameter values or state here.
     */
    onRemove?: (event: WidgetEvent<Settings, State>) => Awaitable<WidgetEventResult<State> | void>;
    /**
     * This code is injected into the overlay
     */
    overlayExtension: {
        dependencies?: {
            css?: string[];
            js?: string[];
            globalStyles?: string;
        };
        // eslint-disable-next-line no-use-before-define
        eventHandler: (event: WidgetOverlayEvent) => void
    };
};

type OverlayWidgetConfig = {
    id: string;
    name: string;
    type: string;
    /**
     * Whether the overlay widget is active and should be rendered on the overlay.
     * Default is true.
     */
    active?: boolean;
    position: Position;
    /**
     * Overlay instance ID where this widget should be shown.
     * If null or undefined, the widget will be shown on the default overlay.
     */
    overlayInstance?: string | null;
    entryAnimation?: Animation | null;
    exitAnimation?: Animation | null;
    settings: Record<string, unknown>;
    state?: Record<string, unknown>;
}

export type WidgetOverlayEvent = {
    name: "show" | "settings-update" | "state-update" | "message" | "remove";
    data: {
        widgetConfig: Pick<
        OverlayWidgetConfig,
        "id" | "type" | "position" | "entryAnimation" | "exitAnimation" | "settings" | "state" | "overlayInstance"
        >;
        widgetType: Pick<
        OverlayWidgetType,
        "id" | "userCanConfigure"
        >;
        previewMode: boolean;
        // Optional additional data for the event (e.g., message content for "message" events)
        data?: unknown;
    };
}