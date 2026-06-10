import type { EffectList } from "./effects";

/**
 * Reserved page id for the "Pinned" shadow page. Buttons with this pageId are
 * replicated onto every real page (unless a page button overrides the slot)
 */
export const CONTROL_DECK_PINNED_PAGE_ID = "pinned";

export type ControlDeckControlType = "button" | "folder";

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

export type ControlDeckNoneIcon = {
    type: "none";
};

/** An emoji icon referenced by its unicode character. */
export type ControlDeckEmojiIcon = {
    type: "emoji";
    /** The emoji character (eg "🔥") */
    emoji: string;
};


export type ControlDeckIcon = ControlDeckImageIcon | ControlDeckGlyphIcon | ControlDeckEmojiIcon | ControlDeckNoneIcon;

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

export type ControlDeckControl = {
    id: string;
    name: string;
    type: ControlDeckControlType;
    /** The page this control belongs to */
    pageId: string;
    /** The parent folder control id, or null when placed at the page root */
    parentId: string | null;
    /** The icon shown on the control */
    icon: ControlDeckIcon;
    backgroundColor?: string;
    /** Placement within the deck's grid */
    position?: ControlDeckControlPosition;
    /** How many grid cells the control spans (default 1x1) */
    size?: ControlDeckControlSize;
    /** Effects to run when the control is pressed. Only used when type is "button" */
    effectList?: EffectList;
    /**
     * Inputs the user is prompted for when the control is pressed on the hosted
     * page. The provided values are sent with the press and are available to
     * effects via $controlDeckInput
     */
    inputs?: ControlDeckControlInput[];
    /**
     * Whether a folder control should automatically return to the parent page after a button within it is pressed. Only used when type is "folder".
     */
    autoReturn?: boolean;
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
     * - "dynamic": grid rotates to best fill the screen for the current orientation
     */
    orientationMode?: ControlDeckOrientationMode;
};

export type ControlDeckResolvedIcon =
    | { type: "image", url: string }
    | { type: "glyph", name: string, color?: string }
    | { type: "emoji", emoji: string };

/**
 * A control as projected to the hosted Control Deck page. Server-only fields
 * (the raw effect list and local icon path) are removed, and the resolved
 * `icon` the page should render is added.
 */
export type ControlDeckControlView =
    Omit<ControlDeckControl, "icon" | "effectList"> & {
        icon?: ControlDeckResolvedIcon;
    };

/** A deck as projected to the hosted Control Deck page. */
export type ControlDeckView =
    Omit<ControlDeck, "controls"> & {
        controls: ControlDeckControlView[];
    };
