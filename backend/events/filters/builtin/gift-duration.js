"use strict";

module.exports = {
    id: "firebot:gift-duration",
    name: "Gift Duration",
    description: "Filter by the duration of the gift sub (in months)",
    events: [
        { eventSourceId: "twitch", eventId: "subs-gifted" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let giftDuration = eventMeta.giftDuration || 1;

        switch (comparisonType) {
        case "is": {
            return giftDuration === value;
        }
        case "is not": {
            return giftDuration !== value;
        }
        case "less than": {
            return giftDuration < value;
        }
        case "greater than": {
            return giftDuration > value;
        }
        default:
            return false;
        }
    }
};