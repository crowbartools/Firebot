import type { EffectList } from "./effects";
import type { Awaitable } from "./util-types";

export type ComparisonType =
    | "is"
    | "is not"
    | "greater than"
    | "greater than or equal to"
    | "less than"
    | "less than or equal to"
    | "include"
    | "doesn't include"
    | "contains"
    | "doesn't contain"
    | "doesn't start with"
    | "starts with"
    | "doesn't end with"
    | "ends with"
    | "matches regex"
    | "doesn't matches regex"
    | "matches regex (case insensitive)"
    | "doesn't match regex (case insensitive)";

export type EventDefinition = {
    id: string;
    name: string;
    description: string;
    cached?: boolean;
    cacheMetaKey?: string;
    cacheTtlInSecs?: number;
    manualMetadata?: Record<string, unknown>;
    activityFeed?: {
        icon: string;
        getMessage: (eventData: Record<string, any>) => string;
        excludeFromChatFeed?: boolean;
    };
};

export type EventSource = {
    id: string;
    name: string;
    description?: string;
    events: EventDefinition[];
};

export type PresetValue = {
    value: unknown;
    display: string;
};

export type FilterSettings = {
    type: string;
    comparisonType: ComparisonType;
    value: unknown;
};

export type EventSourceAndId = {
    eventSourceId: string;
    eventId: string;
};

export type EventData = EventSourceAndId & {
    eventMeta: Record<string, unknown>;
};

export type EventFilter = {
    id: string;
    name: string;
    description: string;
    events: EventSourceAndId[];
    comparisonTypes: string[];
    valueType: "text" | "number" | "preset";
    presetValues?(...args: unknown[]): Awaitable<PresetValue[]>;
    valueIsStillValid?(filterSettings: FilterSettings, ...args: unknown[]): Awaitable<boolean>;
    getSelectedValueDisplay?(filterSettings: FilterSettings, ...args: unknown[]): Awaitable<string>;
    predicate(
        filterSettings: FilterSettings,
        eventData: EventData
    ): Awaitable<boolean>;
};

export type EventFilterData = {
    mode: "inclusive" | "exclusive";
    filters: FilterSettings[];
};

export type EventSettings = {
    id: string;
    type: string;
    active: boolean;
    effectLabel?: string;
    filterData?: EventFilterData;
    effects: EffectList;
    [x: string]: unknown;
};

export type EventGroup = {
    id: string;
    events: EventSettings[];
    active?: boolean;
};

export type TriggeredEvent = {
    event: EventDefinition;
    source: EventSource;
    meta: Record<string, unknown>;
    isManual: boolean;
    isRetrigger: boolean;
};