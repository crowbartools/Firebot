import type { FirebotParameterArray, FirebotParams, FontOptions } from "./parameters";
import type { EffectList } from "./effects";
import type { Awaitable } from "./util-types";

export const CONTROL_DECK_PINNED_PAGE_ID = "pinned";

export const CONTROL_DECK_BUTTON_TYPE_ID = "firebot:button";
export const CONTROL_DECK_FOLDER_TYPE_ID = "firebot:folder";

/** An image icon — either a local file path or a URL. */
export type ControlDeckImageIcon = {
    type: "image";
    /** Whether `path` is a local file path or a URL */
    source: "local" | "url";
    /** Local file path (source "local") or URL (source "url") */
    path: string;
};

/** A Lucide icon referenced by name. */
export type ControlDeckGlyphIcon = {
    type: "glyph";
    /** The Lucide icon name */
    name: string;
    /** Optional CSS color; defaults to the control's text color */
    color?: string;
};

/** An emoji icon referenced by its unicode character. */
export type ControlDeckEmojiIcon = {
    type: "emoji";
    /** The emoji character (eg "🔥") */
    emoji: string;
};

export type ControlDeckIcon = ControlDeckImageIcon | ControlDeckGlyphIcon | ControlDeckEmojiIcon;

export type ControlDeckBackground =
    | { type: "color", color: string }
    | { type: "image", source: "local" | "url", path: string };

export type ControlDeckInputType = "text" | "number" | "toggle" | "preset";

type ControlDeckInputBase = {
    /** Unique name of the input, used to access the value in effects */
    name: string;
    description?: string;
};

export type ControlDeckTextInput = ControlDeckInputBase & {
    type: "text";
};

export type ControlDeckNumberInput = ControlDeckInputBase & {
    type: "number";
};

export type ControlDeckToggleInput = ControlDeckInputBase & {
    type: "toggle";
};

export type ControlDeckPresetInput = ControlDeckInputBase & {
    type: "preset";
    options: string[];
};

export type ControlDeckUserInput = ControlDeckInputBase & {
    type: "user";
};

export type ControlDeckControlInput =
    | ControlDeckTextInput
    | ControlDeckNumberInput
    | ControlDeckToggleInput
    | ControlDeckPresetInput
    | ControlDeckUserInput;

export type ControlDeckControlPosition = {
    col: number;
    row: number;
};

export type ControlDeckControlSize = {
    /** Number of grid columns the control spans (default 1) */
    width: number;
    /** Number of grid rows the control spans (default 1) */
    height: number;
};

export type ControlDeckControl<Params extends FirebotParams = FirebotParams> = {
    id: string;
    /** Reference name (shown in the editor, folder breadcrumbs, etc — not on the control itself) */
    name: string;
    /** The control type id, e.g. "firebot:button" */
    type: string;
    /** Optional label rendered on the control itself, if the control type allows labels */
    label?: string;
    /** Font config for the label */
    labelFont?: Partial<FontOptions>;
    /** Label size as a percentage of the default size (100 = default) */
    labelSize?: number;
    /** The page this control belongs to */
    pageId: string;
    /** The parent folder control id, or null when placed at the page root */
    parentId: string | null;
    /** The icon shown on the control, if the control type allows icons */
    icon?: ControlDeckIcon;
    /** Icon size as a percentage of the default size (100 = default) */
    iconSize?: number;
    /** The background shown behind the control, if the control type allows backgrounds */
    background?: ControlDeckBackground;
    /** Placement within the deck's grid */
    position?: ControlDeckControlPosition;
    /** How many grid cells the control spans (default 1x1) */
    size?: ControlDeckControlSize;
    /**
     * Inputs the user is prompted for when the control is interacted with on the
     * hosted page. The provided values are sent with the interaction and are
     * available to effects via $controlDeckInput
     */
    inputs?: ControlDeckControlInput[];
    /** Type-specific settings, defined by the control type's settingsSchema */
    settings: Params;
};

export type ControlDeckGrid = {
    cols: number;
    rows: number;
};

export type ControlDeckPage = {
    id: string;
    name: string;
};

export type ControlDeck = {
    id: string;
    name: string;
    grid: ControlDeckGrid;
    /** Ordered list of pages. A deck always has at least one page. */
    pages: ControlDeckPage[];
    controls: ControlDeckControl[];
};

export type ControlDeckOrientationMode = "dynamic" | "fixed";

export type ControlDeckSettings = {
    enabled: boolean;
    /** Optional global PIN required to access the hosted page and trigger controls */
    pin?: string;
    /**
     * How the hosted grid responds to device rotation.
     * - "fixed": grid keeps its designed dimensions regardless of orientation
     * - "dynamic": grid rotates to best fill the screen
     */
    orientationMode?: ControlDeckOrientationMode;
};

export type ControlDeckResolvedIcon =
    | { type: "image", url: string }
    | { type: "glyph", name: string, color?: string }
    | { type: "emoji", emoji: string };

/** A control background as projected to the hosted page (local images resolved to urls) */
export type ControlDeckResolvedBackground =
    | { type: "color", color: string }
    | { type: "image", url: string };

export type ControlDeckControlView =
    Omit<ControlDeckControl, "icon" | "background" | "settings"> & {
        icon?: ControlDeckResolvedIcon;
        background?: ControlDeckResolvedBackground;
        resolvedSettings: Record<string, unknown>;
        /** Current runtime state for stateful control types (e.g. a Switch's on/off value) */
        state?: unknown;
        shell: "standard" | "none";
    };

/** A deck as projected to the hosted Control Deck page. */
export type ControlDeckView =
    Omit<ControlDeck, "controls"> & {
        controls: ControlDeckControlView[];
    };

/** The event passed to a control type's onInteraction handler */
export type ControlDeckInteractionEvent<Params extends FirebotParams = FirebotParams> = {
    control: ControlDeckControl<Params>;
    deckId: string;
    action: string;
    data: unknown;
    /** Values the user provided for the control's configured inputs */
    inputValues: Record<string, string | number | boolean>;
};

export type ControlDeckInteractionContext<State = unknown> = {
    /**
     * Runs an effect list with the standard control_deck trigger metadata.
     * metadata is merged into the trigger metadata.
     */
    triggerEffectList: (effectList: EffectList, extraMetadata?: Record<string, unknown>) => Promise<void>;
    /** The control's current runtime state (stateful types only) */
    getState: () => State;
    /**
     * Sets the control's runtime state. The central store persists it and
     * broadcasts the change to connected devices.
     */
    setState: (newState: State) => Promise<void>;
};

/** Context provided when a stateful control type computes its initial state */
export type ControlDeckStateInitContext = {
    triggerEffectList: (effectList: EffectList, extraMetadata?: Record<string, unknown>) => Promise<void>;
};

export type ControlDeckControlTypeState<Params extends FirebotParams = FirebotParams, State = unknown> = {
    /**
     * Called on Firebot startup (and when a control is first added) to compute
     * the state the control should initialize to
     */
    getInitialState: (
        event: { control: ControlDeckControl<Params>, persistedState: State | undefined },
        context: ControlDeckStateInitContext
    ) => Awaitable<State>;
};

export type ControlDeckControlType<Params extends FirebotParams = FirebotParams, State = void> = {
    id: string;
    /** Display name shown in the Add Control picker, e.g. "Slider" */
    name: string;
    description: string;
    /** Font Awesome icon class for the Add Control picker, e.g. "fa-square" */
    icon: string;

    /** Default grid cell span when the control is added */
    defaultSize?: ControlDeckControlSize;
    minSize?: ControlDeckControlSize;
    maxSize?: ControlDeckControlSize;
    /** When false, the control cannot be resized in the editor. Defaults to true. */
    resizable?: boolean;

    /** When true, the standard icon config is shown for controls of this type */
    enableIcon?: boolean;
    /**
     * Default icon for new controls of this type.
     */
    defaultIcon?: ControlDeckIcon;
    /** When true, the standard background config (color or image) is shown for controls of this type */
    enableBackground?: boolean;
    /** When true, the inputs config is shown for controls of this type */
    enableInputs?: boolean;
    /** When true, the optional label (+ label font) config is shown for controls of this type */
    enableLabel?: boolean;

    /** The shell style for the control. "standard" uses the default shell and click animation, "none" removes it. */
    shell?: "standard" | "none";

    /** Schema for the type-specific settings shown in the control edit modal */
    settingsSchema: FirebotParameterArray<Params>;

    /** Declares this control type as stateful. */
    state?: ControlDeckControlTypeState<Params, State>;

    /** Called when a device interacts with a control of this type */
    onInteraction: (
        event: ControlDeckInteractionEvent<Params>,
        context: ControlDeckInteractionContext<State>
    ) => Awaitable<void>;
};
