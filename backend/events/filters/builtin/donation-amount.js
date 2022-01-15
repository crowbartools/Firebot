"use strict";

module.exports = {
    id: "firebot:donation-amount",
    name: "Donation Amount",
    description: "Filter by the amount of donation from StreamLabs/Tipeee/ExtraLife",
    events: [
        { eventSourceId: "streamlabs", eventId: "donation" },
        { eventSourceId: "streamlabs", eventId: "eldonation" },
        { eventSourceId: "tipeeestream", eventId: "donation" },
        { eventSourceId: "streamelements", eventId: "donation" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let donationAmount = eventMeta.donationAmount || 0;


        switch (comparisonType) {
        case "is": {
            return donationAmount === value;
        }
        case "is not": {
            return donationAmount !== value;
        }
        case "less than": {
            return donationAmount < value;
        }
        case "greater than": {
            return donationAmount > value;
        }
        default:
            return false;
        }
    }
};