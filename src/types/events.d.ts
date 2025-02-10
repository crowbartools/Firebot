import { ComparisonType } from "../shared/filter-constants";

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
}

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
    presetValues?(...args: unknown[]): Promise<PresetValue[]> | PresetValue[];
    valueIsStillValid?(filterSettings: FilterSettings, ...args: unknown[]): Promise<boolean> | boolean;
    getSelectedValueDisplay?(filterSettings: FilterSettings, ...args: unknown[]): Promise<string> | string;
    predicate(
        filterSettings: FilterSettings,
        eventData: {
            eventSourceId: string;
            eventId: string;
            eventMeta: Record<string, unknown>;
        }
    ): Promise<boolean> | boolean;
};