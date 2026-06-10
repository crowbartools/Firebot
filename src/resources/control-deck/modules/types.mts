import type {
    ControlDeckGrid,
    ControlDeckControlPosition,
    ControlDeckControlSize,
    ControlDeckControlView,
    ControlDeckControlInput,
    ControlDeckResolvedIcon,
    ControlDeckView,
    ControlDeckPage
} from "../../../types/control-deck.js";

export type GridDims = ControlDeckGrid;

export type ControlPosition = ControlDeckControlPosition;

export type ControlSize = ControlDeckControlSize;

export type { ControlDeckControlView, ControlDeckControlInput, ControlDeckResolvedIcon, ControlDeckView, ControlDeckPage };

export interface DeckSummary {
    id: string;
    name: string;
}

export interface ControlDeckSettings {
    enabled: boolean;
    pinRequired: boolean;
    orientationMode?: "fixed" | "dynamic";
    defaultDeckId?: string | null;
}

export interface PlacedControl {
    control: ControlDeckControlView;
    col: number;
    row: number;
    w: number;
    h: number;
}

/** Values from input prompt, keyed by input name. */
export type ControlInputValues = Record<string, string | number | boolean>;

