"use strict";

module.exports = {
    id: "firebot:gift-count",
    name: "Gift Count",
    description: "Filter by the number of subs gifted",
    events: [
        { eventSourceId: "twitch", eventId: "community-subs-gifted" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let giftCountCount = eventMeta.giftCount || 0;

        switch (comparisonType) {
        case "is": {
            return giftCountCount === value;
        }
        case "is not": {
            return giftCountCount !== value;
        }
        case "less than": {
            return giftCountCount < value;
        }
        case "greater than": {
            return giftCountCount > value;
        }
        default:
            return false;
        }
    }
};