"use strict";
const patronageManager = require("../../../patronageManager");

module.exports = {
    id: "firebot:patronage-earned",
    name: "Spark Patronage Earned",
    description: "Filter by the current spark patronage earned.",
    events: [
        { eventSourceId: "mixer", eventId: "patronage-milestone" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings) => {

        let { comparisonType, value } = filterSettings;

        let patronageEarned = patronageManager.getPatronageData().channel.patronageEarned || 0;

        switch (comparisonType) {
        case "is": {
            return patronageEarned === value;
        }
        case "is not": {
            return patronageEarned !== value;
        }
        case "less than": {
            return patronageEarned < value;
        }
        case "greater than": {
            return patronageEarned > value;
        }
        default:
            return false;
        }
    }
};