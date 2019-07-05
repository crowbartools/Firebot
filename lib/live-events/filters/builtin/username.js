"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:username",
    name: "Username",
    description: "Filter to a specific username",
    events: [
        { eventSourceId: "mixer", eventId: "chat-message" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT, ComparisonType.MATCHES_REGEX],
    valueType: "text",
    /*presetValues: () => {
        return new Promise(resolve => {
            return [{value: 1, display: "one"}];
        });
    },*/
    predicate: (comparisonType, value, eventMeta) => {
        switch (comparisonType) {
        case ComparisonType.IS:
            return eventMeta.username === value;
        case ComparisonType.IS_NOT:
            return eventMeta.username !== value;
        default:
            return false;
        }
    }
};