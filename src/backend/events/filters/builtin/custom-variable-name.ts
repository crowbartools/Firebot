import { ComparisonType } from "../../../../shared/filter-constants";

module.exports = {
    id: "firebot:custom-variable-name",
    name: "Custom Variable Name",
    description: "Filter to a Custom Variable by Name",
    events: [
        { eventSourceId: "firebot", eventId: "custom-variable-set" },
        { eventSourceId: "firebot", eventId: "custom-variable-expired" }
    ],
    comparisonTypes: [
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
    ],
    valueType: "text",
    predicate: (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        // normalize
        const actual = eventMeta.createdCustomVariableName ?? eventMeta.expiredCustomVariableName ?? "";
        const expected = value ?? "";

        switch (comparisonType) {
            case ComparisonType.IS:
                return actual === expected;
            case ComparisonType.IS_NOT:
                return actual !== expected;
            case ComparisonType.CONTAINS:
                return actual.includes(expected);
            case ComparisonType.DOESNT_CONTAIN:
                return !actual.includes(expected);
            case ComparisonType.STARTS_WITH:
                return actual.startsWith(expected);
            case ComparisonType.DOESNT_STARTS_WITH:
                return !actual.startsWith(expected);
            case ComparisonType.ENDS_WITH:
                return actual.endsWith(expected);
            case ComparisonType.DOESNT_END_WITH:
                return !actual.endsWith(expected);
            case ComparisonType.MATCHES_REGEX: {
                const regex = new RegExp(expected, "gi");
                return regex.test(actual);
            }
            case ComparisonType.DOESNT_MATCH_REGEX: {
                const regex = new RegExp(expected, "gi");
                return !regex.test(actual);
            }
            case ComparisonType.MATCHES_REGEX_CS: {
                const regex = new RegExp(expected, "g");
                return regex.test(actual);
            }
            case ComparisonType.DOESNT_MATCH_REGEX_CS: {
                const regex = new RegExp(expected, "g");
                return !regex.test(actual);
            }
            default:
                return false;
        }
    }
};