"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:new-view-time",
    name: "New View Time",
    description: "Filter a viewers new view time (hours)",
    events: [
        { eventSourceId: "firebot", eventId: "view-time-update" }
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

        const newViewTime = eventMeta.newViewTime || 0;

        switch (comparisonType) {
            case ComparisonType.IS: {
                return newViewTime === value;
            }
            case ComparisonType.IS_NOT: {
                return newViewTime !== value;
            }
            case ComparisonType.LESS_THAN: {
                return newViewTime < value;
            }
            case ComparisonType.LESS_THAN_OR_EQUAL_TO: {
                return newViewTime <= value;
            }
            case ComparisonType.GREATER_THAN: {
                return newViewTime > value;
            }
            case ComparisonType.GREATER_THAN_OR_EQUAL_TO: {
                return newViewTime >= value;
            }
            default:
                return false;
        }
    }
};