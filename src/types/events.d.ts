import type { ComparisonType } from "../shared/filter-constants";
import type { EffectList } from "./effects";
import type { Awaitable } from "./util-types";

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
    value: any;
    display: string;
};

export type FilterSettings = {
    type: string;
    comparisonType: ComparisonType;
    value: any;
};

export type EventSourceAndId = {
    eventSourceId: string;
    eventId: string;
};

export type EventData = EventSourceAndId & {
    eventMeta: Record<string, any>;
};

export type EventFilter = {
    id: string;
    name: string;
    description: string;
    events: EventSourceAndId[];
    comparisonTypes: string[];
    valueType: "text" | "preset";
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