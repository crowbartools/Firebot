"use strict";

module.exports = {
    id: "firebot:cheerbitsamount",
    name: "Cheer Bits Amount",
    description: "Filter by the amount of bits in a Cheer",
    events: [
        { eventSourceId: "twitch", eventId: "cheer" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const bitsAmount = eventMeta.totalBits || 0;


        switch (comparisonType) {
        case "is": {
            return bitsAmount === value;
        }
        case "is not": {
            return bitsAmount !== value;
        }
        case "less than": {
            return bitsAmount < value;
        }
        case "greater than": {
            return bitsAmount > value;
        }
        default:
            return false;
        }
    }
};