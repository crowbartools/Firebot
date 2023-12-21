"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:gift-duration",
    name: "Gift Duration",
    description: "Filter by the duration of the gift sub (in months)",
    events: [
        { eventSourceId: "twitch", eventId: "subs-gifted" }
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

        const giftDuration = eventMeta.giftDuration || 1;

        switch (comparisonType) {
            case ComparisonType.IS: {
                return giftDuration === value;
            }
            case ComparisonType.IS_NOT: {
                return giftDuration !== value;
            }
            case ComparisonType.LESS_THAN: {
                return giftDuration < value;
            }
            case ComparisonType.LESS_THAN_OR_EQUAL_TO: {
                return giftDuration <= value;
            }
            case ComparisonType.GREATER_THAN: {
                return giftDuration > value;
            }
            case ComparisonType.GREATER_THAN_OR_EQUAL_TO: {
                return giftDuration >= value;
            }
            default:
                return false;
        }
    }
};