"use strict";

module.exports = {
    id: "firebot:donation-amount",
    name: "Donation Amount",
    description: "Filter by the amount of donation from StreamLabs/Tipeee/ExtraLife",
    events: [
        { eventSourceId: "streamlabs", eventId: "donation" },
        { eventSourceId: "streamlabs", eventId: "eldonation" },
        { eventSourceId: "tipeeestream", eventId: "donation" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let dononationAmount = eventMeta.dononationAmount || 0;


        switch (comparisonType) {
        case "is": {
            return dononationAmount === value;
        }
        case "is not": {
            return dononationAmount !== value;
        }
        case "less than": {
            return dononationAmount < value;
        }
        case "greater than": {
            return dononationAmount > value;
        }
        default:
            return false;
        }
    }
};