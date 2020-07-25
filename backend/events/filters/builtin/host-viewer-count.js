"use strict";

module.exports = {
    id: "firebot:host-viewer-count",
    name: "Host Viewer Count",
    description: "Filter by how many viewers have been brought over by the host.",
    events: [
        { eventSourceId: "twitch", eventId: "host" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let hostViewerCount = eventMeta.viewerCount || 0;

        switch (comparisonType) {
        case "is": {
            return hostViewerCount === value;
        }
        case "is not": {
            return hostViewerCount !== value;
        }
        case "less than": {
            return hostViewerCount < value;
        }
        case "greater than": {
            return hostViewerCount > value;
        }
        default:
            return false;
        }
    }
};