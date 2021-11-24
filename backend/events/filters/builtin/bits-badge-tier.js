"use strict";

module.exports = {
    id: "firebot:bits-badge-tier",
    name: "Bits Badge Tier",
    description: "Filter by the tier of the bits badge that was unlocked (100, 1000, 5000, etc.).",
    events: [
        { eventSourceId: "twitch", eventId: "bits-badge-unlocked" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const badgeTier = eventMeta.badgeTier || 0;


        switch (comparisonType) {
        case "is": {
            return badgeTier === value;
        }
        case "is not": {
            return badgeTier !== value;
        }
        case "less than": {
            return badgeTier < value;
        }
        case "greater than": {
            return badgeTier > value;
        }
        default:
            return false;
        }
    }
};