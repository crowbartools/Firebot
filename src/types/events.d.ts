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
    presetValues(...args: any[]): Promise<unknown[]>;
    predicate(
        filterSettings: { comparisonType: string; value: any },
        eventData: {
            eventSourceId: string;
            eventId: string;
            eventMeta: Record<string, any>;
        }
    ): Promise<boolean>;
};