"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:bits-badge-tier",
    name: "Bits Badge Tier",
    description: "Filter by the tier of the bits badge that was unlocked (100, 1000, 5000, etc.).",
    events: [
        { eventSourceId: "twitch", eventId: "bits-badge-unlocked" }
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

        const badgeTier = eventMeta.badgeTier || 0;

        switch (comparisonType) {
            case ComparisonType.IS: {
                return badgeTier === value;
            }
            case ComparisonType.IS_NOT: {
                return badgeTier !== value;
            }
            case ComparisonType.LESS_THAN: {
                return badgeTier < value;
            }
            case ComparisonType.LESS_THAN_OR_EQUAL_TO: {
                return badgeTier <= value;
            }
            case ComparisonType.GREATER_THAN: {
                return badgeTier > value;
            }
            case ComparisonType.GREATER_THAN_OR_EQUAL_TO: {
                return badgeTier >= value;
            }
            default:
                return false;
        }
    }
};