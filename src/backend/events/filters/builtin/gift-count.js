"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:gift-count",
    name: "Gift Count",
    description: "Filter by the number of subs gifted",
    events: [
        { eventSourceId: "twitch", eventId: "community-subs-gifted" }
    ],
    comparisonTypes: [
        ComparisonType.IS,
        ComparisonType.IS_NOT,
        ComparisonType.LESS_THAN,
        ComparisonType.LESS_THAN_OR_EQUAL_TO,
        ComparisonType.GREATER_THAN,
        ComparisonType.GREATER_THAN_OR_EQUAL_TO
    ],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const giftCountCount = eventMeta.subCount || 0;

        switch (comparisonType) {
            case ComparisonType.IS: {
                return giftCountCount === value;
            }
            case ComparisonType.IS_NOT: {
                return giftCountCount !== value;
            }
            case ComparisonType.LESS_THAN: {
                return giftCountCount < value;
            }
            case ComparisonType.LESS_THAN_OR_EQUAL_TO: {
                return giftCountCount <= value;
            }
            case ComparisonType.GREATER_THAN: {
                return giftCountCount > value;
            }
            case ComparisonType.GREATER_THAN_OR_EQUAL_TO: {
                return giftCountCount >= value;
            }
            default:
                return false;
        }
    }
};