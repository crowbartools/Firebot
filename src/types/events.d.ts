import { ComparisonType } from "../shared/filter-constants";
import { Awaitable } from "./util-types";

export type EventSource = {
    id: string;
    name: string;
    events: Array<{
        id: string;
        name: string;
        description: string;
        cached?: boolean;
        manualMetadata?: Record<string, unknown>;
    }>;
};

export type PresetValue = {
    value: any;
    display: string;
};

export type FilterSettings = {
    comparisonType: ComparisonType;
    value: any;
};

export type EventFilter = {
    id: string;
    name: string;
    description: string;
    events: Array<{
        eventSourceId: string;
        eventId: string;
    }>;
    comparisonTypes: string[];
    valueType: "text" | "preset";
    presetValues?(...args: unknown[]): Awaitable<PresetValue[]>;
    valueIsStillValid?(filterSettings: FilterSettings, ...args: unknown[]): Awaitable<boolean>;
    getSelectedValueDisplay?(filterSettings: FilterSettings, ...args: unknown[]): Awaitable<string>;
    predicate(
        filterSettings: FilterSettings,
        eventData: {
            eventSourceId: string;
            eventId: string;
            eventMeta: Record<string, unknown>;
        }
    ): Awaitable<boolean>;
};

export type FirebotEvent = {
    id: string;
    type: string;
    active: boolean;
    effectLabel?: string;
    [x: string]: unknown;
};

export type EventGroup = {
    id: string;
    events: FirebotEvent[];
};