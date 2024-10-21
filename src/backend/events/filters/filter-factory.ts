import { EventFilter } from "../../../types/events";
import { ComparisonType } from "../../../shared/filter-constants";

type EventData = {
    eventSourceId: string;
    eventId: string;
    eventMeta: Record<string, unknown>;
}

type FilterEvent = Omit<EventData, "eventMeta">;

type FilterConfig = {
    id: string;
    name: string;
    description: string;
    events: Array<FilterEvent>;
    eventMetaKey: string | ((eventData: EventData) => string);
    caseInsensitive?: boolean;
};

const TEXT_COMPARISON_TYPES = [
    ComparisonType.IS,
    ComparisonType.IS_NOT,
    ComparisonType.CONTAINS,
    ComparisonType.MATCHES_REGEX
];

const NUMBER_COMPARISON_TYPES = [
    ComparisonType.IS,
    ComparisonType.IS_NOT,
    ComparisonType.LESS_THAN,
    ComparisonType.LESS_THAN_OR_EQUAL_TO,
    ComparisonType.GREATER_THAN,
    ComparisonType.GREATER_THAN_OR_EQUAL_TO
];


function compareValue(
    comparisonType: ComparisonType,
    expectedValue: unknown,
    actualValue: unknown
): boolean {
    switch (comparisonType) {
        case ComparisonType.IS:
            return actualValue === expectedValue;
        case ComparisonType.IS_NOT:
            return actualValue !== expectedValue;
        case ComparisonType.LESS_THAN:
            return actualValue < expectedValue;
        case ComparisonType.LESS_THAN_OR_EQUAL_TO:
            return actualValue <= expectedValue;
        case ComparisonType.GREATER_THAN:
            return actualValue > expectedValue;
        case ComparisonType.GREATER_THAN_OR_EQUAL_TO:
            return actualValue >= expectedValue;
        case ComparisonType.CONTAINS:
            return actualValue?.toString().includes(expectedValue?.toString() ?? "");
        case ComparisonType.MATCHES_REGEX: {
            const regex = new RegExp(expectedValue?.toString() ?? "", "gi");
            return regex.test(actualValue?.toString() ?? "");
        }
        default:
            return false;
    }
}

function getMetaKey(eventMetaKey: FilterConfig["eventMetaKey"], event: EventData): string {
    if (typeof eventMetaKey === "function") {
        return eventMetaKey(event);
    }
    return eventMetaKey;
}

export function createTextFilter({
    eventMetaKey,
    caseInsensitive,
    ...config
}: FilterConfig): Omit<EventFilter, "presetValues"> {
    return {
        ...config,
        comparisonTypes: TEXT_COMPARISON_TYPES,
        valueType: "text",
        async predicate(filterSettings, eventData) {
            const { comparisonType, value } = filterSettings;
            const { eventMeta } = eventData;

            let eventValue = eventMeta[getMetaKey(eventMetaKey, eventData)] ?? "";
            if (caseInsensitive) {
                eventValue = eventValue.toString().toLowerCase();
            }
            const filterValue =
        (caseInsensitive ? value?.toLowerCase() : value) ?? "";

            return compareValue(comparisonType, filterValue, eventValue);
        }
    };
}

export function createNumberFilter({
    eventMetaKey,
    ...config
}: Omit<FilterConfig, "caseInsensitive">): Omit<EventFilter, "presetValues" | "valueType"> & {
        valueType: "number";
    } {
    return {
        ...config,
        comparisonTypes: NUMBER_COMPARISON_TYPES,
        valueType: "number",
        async predicate(filterSettings, eventData) {
            const { comparisonType, value } = filterSettings;
            const { eventMeta } = eventData;

            const eventValue = eventMeta[getMetaKey(eventMetaKey, eventData)] ?? 0;

            return compareValue(comparisonType, value, eventValue);
        }
    };
}

export function createTextOrNumberFilter({
    eventMetaKey,
    ...config
}: Omit<FilterConfig, "caseInsensitive">): Omit<EventFilter, "presetValues"> {
    return {
        ...config,
        comparisonTypes: [...TEXT_COMPARISON_TYPES, ...NUMBER_COMPARISON_TYPES],
        valueType: "text",
        async predicate(filterSettings, eventData) {
            const { comparisonType, value: filterValue } = filterSettings;
            const { eventMeta } = eventData;

            const eventValue = eventMeta[getMetaKey(eventMetaKey, eventData)] ?? "";

            return compareValue(comparisonType, filterValue, eventValue);
        }
    };
}
