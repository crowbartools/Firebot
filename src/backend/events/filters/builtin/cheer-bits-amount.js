"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:cheerbitsamount",
    name: "Cheer Bits Amount",
    description: "Filter by the amount of bits in a Cheer",
    events: [
        { eventSourceId: "twitch", eventId: "cheer" }
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

        const bitsAmount = eventMeta.bits || 0;

        switch (comparisonType) {
            case ComparisonType.IS: {
                return bitsAmount === value;
            }
            case ComparisonType.IS_NOT: {
                return bitsAmount !== value;
            }
            case ComparisonType.LESS_THAN: {
                return bitsAmount < value;
            }
            case ComparisonType.LESS_THAN_OR_EQUAL_TO: {
                return bitsAmount <= value;
            }
            case ComparisonType.GREATER_THAN: {
                return bitsAmount > value;
            }
            case ComparisonType.GREATER_THAN_OR_EQUAL_TO: {
                return bitsAmount >= value;
            }
            default:
                return false;
        }
    }
};