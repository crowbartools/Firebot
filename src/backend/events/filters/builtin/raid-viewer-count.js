"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:raid-viewer-count",
    name: "Raid Viewer Count",
    description: "Filter by how many viewers have been brought or are being sent over by the raid.",
    events: [
        { eventSourceId: "twitch", eventId: "raid" },
        { eventSourceId: "twitch", eventId: "raid-sent-off" }
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

        const raidViewerCount = eventMeta.viewerCount || 0;

        switch (comparisonType) {
            case ComparisonType.IS: {
                return raidViewerCount === value;
            }
            case ComparisonType.IS_NOT: {
                return raidViewerCount !== value;
            }
            case ComparisonType.LESS_THAN: {
                return raidViewerCount < value;
            }
            case ComparisonType.LESS_THAN_OR_EQUAL_TO: {
                return raidViewerCount <= value;
            }
            case ComparisonType.GREATER_THAN: {
                return raidViewerCount > value;
            }
            case ComparisonType.GREATER_THAN_OR_EQUAL_TO: {
                return raidViewerCount >= value;
            }
            default:
                return false;
        }
    }
};
