"use strict";

module.exports = {
    id: "firebot:raid-viewer-count",
    name: "Raid Viewer Count",
    description: "Filter by how many viewers have been brought over by the raid.",
    events: [
        { eventSourceId: "twitch", eventId: "raid" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let raidViewerCount = eventMeta.viewerCount || 0;

        switch (comparisonType) {
        case "is": {
            return raidViewerCount === value;
        }
        case "is not": {
            return raidViewerCount !== value;
        }
        case "less than": {
            return raidViewerCount < value;
        }
        case "greater than": {
            return raidViewerCount > value;
        }
        default:
            return false;
        }
    }
};