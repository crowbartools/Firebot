"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:host-viewer-count",
    name: "Host Viewer Count",
    description: "Filter by how many viewers have been brought over by the host.",
    events: [
        { eventSourceId: "twitch", eventId: "host" }
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

        const hostViewerCount = eventMeta.viewerCount || 0;

        switch (comparisonType) {
        case ComparisonType.IS: {
            return hostViewerCount === value;
        }
        case ComparisonType.IS_NOT: {
            return hostViewerCount !== value;
        }
        case ComparisonType.LESS_THAN: {
            return hostViewerCount < value;
        }
        case ComparisonType.LESS_THAN_OR_EQUAL_TO: {
            return hostViewerCount <= value;
        }
        case ComparisonType.GREATER_THAN: {
            return hostViewerCount > value;
        }
        case ComparisonType.GREATER_THAN_OR_EQUAL_TO: {
            return hostViewerCount >= value;
        }
        default:
            return false;
        }
    }
};