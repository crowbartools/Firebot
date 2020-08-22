"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:donationfrom",
    name: "Donation From",
    description: "Filter to a specific donation sender",
    events: [
        { eventSourceId: "streamlabs", eventId: "donation" },
        { eventSourceId: "streamlabs", eventId: "eldonation" },
        { eventSourceId: "tipeeestream", eventId: "donation" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT, ComparisonType.CONTAINS, ComparisonType.MATCHES_REGEX],
    valueType: "text",
    /*presetValues: () => {
        return new Promise(resolve => {
            return [{value: 1, display: "one"}];
        });
    },*/
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        // normalize usernames
        let eventUsername = eventMeta.from ? eventMeta.from.toLowerCase() : "";
        let filterUsername = value ? value.toLowerCase() : "";

        switch (comparisonType) {
        case ComparisonType.IS:
            return eventUsername === filterUsername;
        case ComparisonType.IS_NOT:
            return eventUsername !== filterUsername;
        case ComparisonType.CONTAINS:
            return eventUsername.includes(filterUsername);
        case ComparisonType.MATCHES_REGEX: {
            let regex = new RegExp(filterUsername, "gi");
            return regex.test(eventUsername);
        }
        default:
            return false;
        }
    }
};