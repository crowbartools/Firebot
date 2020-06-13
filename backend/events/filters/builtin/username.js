"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:username",
    name: "Username",
    description: "Filter to a specific username",
    events: [
        { eventSourceId: "mixer", eventId: "chat-message" },
        { eventSourceId: "mixer", eventId: "subscribed" },
        { eventSourceId: "mixer", eventId: "resub" },
        { eventSourceId: "mixer", eventId: "hosted" },
        { eventSourceId: "mixer", eventId: "followed" },
        { eventSourceId: "mixer", eventId: "user-joined-mixplay" },
        { eventSourceId: "mixer", eventId: "user-joined-chat" },
        { eventSourceId: "mixer", eventId: "user-left-chat" },
        { eventSourceId: "mixer", eventId: "messages-purged" },
        { eventSourceId: "mixer", eventId: "user-banned" },
        { eventSourceId: "mixer", eventId: "skill" },
        { eventSourceId: "mixer", eventId: "viewer-arrived" },
        { eventSourceId: "mixer", eventId: "subscription-gifted" },
        { eventSourceId: "mixer", eventId: "progression-levelup" },
        { eventSourceId: "streamloots", eventId: "purchase" },
        { eventSourceId: "streamloots", eventId: "redemption" }
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
        let eventUsername = eventMeta.username ? eventMeta.username.toLowerCase() : "";
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