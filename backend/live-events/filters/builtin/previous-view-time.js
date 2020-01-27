"use strict";

module.exports = {
    id: "firebot:previous-view-time",
    name: "Previous View Time",
    description: "Filter a viewers previous view time (hours)",
    events: [
        { eventSourceId: "firebot", eventId: "view-time-update" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let previousViewTime = eventMeta.previousViewTime || 0;

        switch (comparisonType) {
        case "is": {
            return previousViewTime === value;
        }
        case "is not": {
            return previousViewTime !== value;
        }
        case "less than": {
            return previousViewTime < value;
        }
        case "greater than": {
            return previousViewTime > value;
        }
        default:
            return false;
        }
    }
};