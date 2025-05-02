import { EventFilter, FilterSettings, PresetValue } from "../../../types/events";
import { ComparisonType } from "../../../shared/filter-constants";
import { extractPropertyWithPath } from "../../utility";

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
    eventMetaKey: string | ((eventData: EventData, filterSettings: FilterSettings) => string);
    caseInsensitive?: boolean;
};

type PresetFilterConfig = FilterConfig & {
    presetValues: (...args: unknown[]) => Promise<PresetValue[]> | PresetValue[];
    valueIsStillValid?(filterSettings: FilterSettings, ...args: unknown[]): Promise<boolean> | boolean;
    getSelectedValueDisplay?(filterSettings: FilterSettings, ...args: unknown[]): Promise<string> | string;
    allowIsNot?: boolean;
}

const TEXT_COMPARISON_TYPES = [
    ComparisonType.IS,
    ComparisonType.IS_NOT,
    ComparisonType.CONTAINS,
    ComparisonType.DOESNT_CONTAIN,
    ComparisonType.STARTS_WITH,
    ComparisonType.DOESNT_STARTS_WITH,
    ComparisonType.ENDS_WITH,
    ComparisonType.DOESNT_END_WITH,
    ComparisonType.MATCHES_REGEX_CS,
    ComparisonType.DOESNT_MATCH_REGEX_CS,
    ComparisonType.MATCHES_REGEX,
    ComparisonType.DOESNT_MATCH_REGEX
];

const NUMBER_UNIQUE_COMPARISON_TYPES = [
    ComparisonType.LESS_THAN,
    ComparisonType.LESS_THAN_OR_EQUAL_TO,
    ComparisonType.GREATER_THAN,
    ComparisonType.GREATER_THAN_OR_EQUAL_TO
];

const NUMBER_COMPARISON_TYPES = [
    ComparisonType.IS,
    ComparisonType.IS_NOT,
    ...NUMBER_UNIQUE_COMPARISON_TYPES
];

const NUMBER_TEXT_COMPARISON_TYPES = [
    ...TEXT_COMPARISON_TYPES,
    ...NUMBER_UNIQUE_COMPARISON_TYPES
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
        case ComparisonType.CONTAINS:
            return actualValue?.toString().includes(expectedValue?.toString() ?? "");
        case ComparisonType.DOESNT_CONTAIN:
            return !actualValue?.toString().includes(expectedValue?.toString() ?? "");
        case ComparisonType.STARTS_WITH:
            return actualValue?.toString().startsWith(expectedValue?.toString() ?? "");
        case ComparisonType.DOESNT_STARTS_WITH:
            return !actualValue?.toString().startsWith(expectedValue?.toString() ?? "");
        case ComparisonType.ENDS_WITH:
            return actualValue?.toString().endsWith(expectedValue?.toString() ?? "");
        case ComparisonType.DOESNT_END_WITH:
            return !actualValue?.toString().endsWith(expectedValue?.toString() ?? "");
        case ComparisonType.LESS_THAN:
            return actualValue < expectedValue;
        case ComparisonType.LESS_THAN_OR_EQUAL_TO:
            return actualValue <= expectedValue;
        case ComparisonType.GREATER_THAN:
            return actualValue > expectedValue;
        case ComparisonType.GREATER_THAN_OR_EQUAL_TO:
            return actualValue >= expectedValue;
        case ComparisonType.MATCHES_REGEX: {
            const regex = new RegExp(expectedValue?.toString() ?? "", "gi");
            return regex.test(actualValue?.toString() ?? "");
        }
        case ComparisonType.DOESNT_MATCH_REGEX: {
            const regex = new RegExp(expectedValue?.toString() ?? "", "gi");
            return !regex.test(actualValue?.toString() ?? "");
        }
        case ComparisonType.MATCHES_REGEX_CS: {
            const regex = new RegExp(expectedValue?.toString() ?? "", "g");
            return regex.test(actualValue?.toString() ?? "");
        }
        case ComparisonType.DOESNT_MATCH_REGEX_CS: {
            const regex = new RegExp(expectedValue?.toString() ?? "", "g");
            return !regex.test(actualValue?.toString() ?? "");
        }
        default:
            return false;
    }
}

function getMetaKey(eventMetaKey: FilterConfig["eventMetaKey"], event: EventData, filter: FilterSettings): string {
    if (typeof eventMetaKey === "function") {
        return eventMetaKey(event, filter);
    }
    return eventMetaKey;
}

export function createTextFilter({
    eventMetaKey,
    caseInsensitive,
    ...config
}: Omit<FilterConfig, "presetValues" | "allowIsNot">): Omit<EventFilter, "presetValues"> {
    return {
        ...config,
        comparisonTypes: TEXT_COMPARISON_TYPES,
        valueType: "text",
        async predicate(filterSettings, eventData) {
            const { comparisonType, value } = filterSettings;
            const { eventMeta } = eventData;

            let eventValue = extractPropertyWithPath(eventMeta, getMetaKey(eventMetaKey, eventData, filterSettings)) ?? "";
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
}: Omit<FilterConfig, "caseInsensitive" | "presetValues" | "allowIsNot">): Omit<EventFilter, "presetValues" | "valueType"> & {
        valueType: "number";
    } {
    return {
        ...config,
        comparisonTypes: NUMBER_COMPARISON_TYPES,
        valueType: "number",
        async predicate(filterSettings, eventData) {
            const { comparisonType, value } = filterSettings;
            const { eventMeta } = eventData;

            const eventValue = extractPropertyWithPath(eventMeta, getMetaKey(eventMetaKey, eventData, filterSettings)) ?? 0;

            return compareValue(comparisonType, value, eventValue);
        }
    };
}

export function createTextOrNumberFilter({
    eventMetaKey,
    caseInsensitive,
    ...config
}: Omit<FilterConfig, "presetValues" | "allowIsNot">): Omit<EventFilter, "presetValues"> {
    return {
        ...config,
        comparisonTypes: NUMBER_TEXT_COMPARISON_TYPES,
        valueType: "text",
        async predicate(filterSettings, eventData) {
            const { comparisonType, value } = filterSettings;
            const { eventMeta } = eventData;

            let eventValue = extractPropertyWithPath(eventMeta, getMetaKey(eventMetaKey, eventData, filterSettings)) ?? "";
            if (caseInsensitive) {
                eventValue = eventValue.toString().toLowerCase();
            }
            const filterValue =
        (caseInsensitive ? value?.toString()?.toLowerCase() : value) ?? "";
            return compareValue(comparisonType, filterValue, eventValue);
        }
    };
}

export function createPresetFilter({
    eventMetaKey,
    presetValues,
    getSelectedValueDisplay,
    valueIsStillValid,
    allowIsNot = false,
    ...config
}: Omit<PresetFilterConfig, "caseInsensitive">): EventFilter {
    const comparisonTypes: ComparisonType[] = [ComparisonType.IS];
    if (allowIsNot) {
        comparisonTypes.push(ComparisonType.IS_NOT);
    }

    const valueDisplay = getSelectedValueDisplay ?? (async (filterSettings, presetValues?: PresetValue[]) => {
        return presetValues.find(pv => pv.value === filterSettings.value)?.display ?? "[Not Set]";
    });

    return {
        ...config,
        comparisonTypes,
        valueType: "preset",
        presetValues,
        getSelectedValueDisplay: valueDisplay,
        valueIsStillValid,
        async predicate(filterSettings, eventData) {
            const { value, comparisonType } = filterSettings;
            const { eventMeta } = eventData;

            const data = extractPropertyWithPath(eventMeta, getMetaKey(eventMetaKey, eventData, filterSettings));

            const output = data === value || data.toString() === value;

            return comparisonType === ComparisonType.IS ? output : !output;
        }
    };
}
