"use strict";

module.exports = {
    id: "firebot:viewer-level",
    name: "Viewer Level",
    description: "Filter by viewers channel level (rank)",
    events: [
        { eventSourceId: "mixer", eventId: "progression-levelup" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let userLevel = eventMeta.userLevel;

        if (userLevel === undefined) {
            return false;
        }

        switch (comparisonType) {
        case "is": {
            return userLevel === value;
        }
        case "is not": {
            return userLevel !== value;
        }
        case "less than": {
            return userLevel < value;
        }
        case "greater than": {
            return userLevel > value;
        }
        default:
            return false;
        }
    }
};