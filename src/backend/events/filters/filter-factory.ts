import { EventFilter } from "../../../types/events";
import { ComparisonType } from "../../../shared/filter-constants";

type FilterConfig = {
    id: string;
    name: string;
    description: string;
    events: Array<{
        eventSourceId: string;
        eventId: string;
    }>;
    eventMetaKey: string;
    caseInsensitive?: boolean;
};

export function createTextFilter({
    eventMetaKey,
    caseInsensitive,
    ...config
}: FilterConfig): Omit<EventFilter, "presetValues"> {
    return {
        ...config,
        comparisonTypes: [
            ComparisonType.IS,
            ComparisonType.IS_NOT,
            ComparisonType.CONTAINS,
            ComparisonType.MATCHES_REGEX
        ],
        valueType: "text",
        predicate(filterSettings, eventData) {
            const { comparisonType, value } = filterSettings;
            const { eventMeta } = eventData;

            let eventValue = eventMeta[eventMetaKey] ?? "";
            if (caseInsensitive) {
                eventValue = eventValue.toString().toLowerCase();
            }
            const filterValue =
        (caseInsensitive ? value?.toLowerCase() : value) ?? "";

            switch (comparisonType) {
                case ComparisonType.IS:
                    return eventValue === filterValue;
                case ComparisonType.IS_NOT:
                    return eventValue !== filterValue;
                case ComparisonType.CONTAINS:
                    return eventValue.includes(filterValue);
                case ComparisonType.MATCHES_REGEX: {
                    const regex = new RegExp(filterValue, "gi");
                    return regex.test(eventValue);
                }
                default:
                    return false;
            }
        }
    };
}

export function createNumberFilter({
    eventMetaKey,
    caseInsensitive,
    ...config
}: FilterConfig): Omit<EventFilter, "presetValues" | "valueType"> & {
        valueType: "number";
    } {
    return {
        ...config,
        comparisonTypes: [
            ComparisonType.IS,
            ComparisonType.IS_NOT,
            ComparisonType.LESS_THAN,
            ComparisonType.LESS_THAN_OR_EQUAL_TO,
            ComparisonType.GREATER_THAN,
            ComparisonType.GREATER_THAN_OR_EQUAL_TO
        ],
        valueType: "number",
        async predicate(filterSettings, eventData) {
            const { comparisonType, value } = filterSettings;
            const { eventMeta } = eventData;

            const eventValue = eventMeta[eventMetaKey] ?? 0;

            switch (comparisonType) {
                case ComparisonType.IS: {
                    return eventValue === value;
                }
                case ComparisonType.IS_NOT: {
                    return eventValue !== value;
                }
                case ComparisonType.LESS_THAN: {
                    return eventValue < value;
                }
                case ComparisonType.LESS_THAN_OR_EQUAL_TO: {
                    return eventValue <= value;
                }
                case ComparisonType.GREATER_THAN: {
                    return eventValue > value;
                }
                case ComparisonType.GREATER_THAN_OR_EQUAL_TO: {
                    return eventValue >= value;
                }
                default:
                    return false;
            }
        }
    };
}
