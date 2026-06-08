// Shared types for the hosted Control Deck Vue app.
//
// The deck/control shapes are owned by the backend (the HTTP server produces
// them), so we reuse them here. Type-only imports are erased at compile time,
// so there is no runtime coupling to backend code.

import type {
    ControlDeckGrid,
    ControlDeckControlPosition,
    ControlDeckControlSize,
    ControlDeckControlView,
    ControlDeckResolvedIcon,
    ControlDeckView,
    ControlDeckPage
} from "../../../types/control-deck.js";

export type GridDims = ControlDeckGrid;

export type ControlPosition = ControlDeckControlPosition;

export type ControlSize = ControlDeckControlSize;

export type { ControlDeckControlView, ControlDeckResolvedIcon, ControlDeckView, ControlDeckPage };

export interface DeckSummary {
    id: string;
    name: string;
}

export interface AuthState {
    enabled: boolean;
    pinRequired: boolean;
    orientationMode?: "fixed" | "dynamic";
}

export interface PlacedControl {
    control: ControlDeckControlView;
    col: number;
    row: number;
    /** Effective column span (after fit/shrink resolution) */
    w: number;
    /** Effective row span (after fit/shrink resolution) */
    h: number;
}

