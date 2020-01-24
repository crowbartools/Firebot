"use strict";

module.exports = {
    id: "firebot:viewer-total-hearts",
    name: "Viewer Hearts",
    description: "Filter by viewers total hearts (xp) towards channel progression",
    events: [
        { eventSourceId: "mixer", eventId: "progression-levelup" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let userTotalHearts = eventMeta.userTotalHearts;

        if (userTotalHearts === undefined) {
            return false;
        }

        switch (comparisonType) {
        case "is": {
            return userTotalHearts === value;
        }
        case "is not": {
            return userTotalHearts !== value;
        }
        case "less than": {
            return userTotalHearts < value;
        }
        case "greater than": {
            return userTotalHearts > value;
        }
        default:
            return false;
        }
    }
};