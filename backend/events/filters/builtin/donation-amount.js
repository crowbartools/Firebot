"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:donation-amount",
    name: "Donation Amount",
    description: "Filter by the amount of donation from StreamLabs/Tipeee/ExtraLife",
    events: [
        { eventSourceId: "streamlabs", eventId: "donation" },
        { eventSourceId: "streamlabs", eventId: "eldonation" },
        { eventSourceId: "tipeeestream", eventId: "donation" },
        { eventSourceId: "streamelements", eventId: "donation" }
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

        const dononationAmount = eventMeta.dononationAmount || 0;

        switch (comparisonType) {
        case ComparisonType.IS: {
            return dononationAmount === value;
        }
        case ComparisonType.IS_NOT: {
            return dononationAmount !== value;
        }
        case ComparisonType.LESS_THAN: {
            return dononationAmount < value;
        }
        case ComparisonType.LESS_THAN_OR_EQUAL_TO: {
            return dononationAmount <= value;
        }
        case ComparisonType.GREATER_THAN: {
            return dononationAmount > value;
        }
        case ComparisonType.GREATER_THAN_OR_EQUAL_TO: {
            return dononationAmount >= value;
        }
        default:
            return false;
        }
    }
};