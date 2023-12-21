"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:username",
    name: "Username",
    description: "Filter to a specific username",
    events: [
        { eventSourceId: "twitch", eventId: "cheer" },
        { eventSourceId: "twitch", eventId: "bits-badge-unlocked" },
        { eventSourceId: "twitch", eventId: "subs-gifted" },
        { eventSourceId: "twitch", eventId: "sub" },
        { eventSourceId: "twitch", eventId: "prime-sub-upgraded" },
        { eventSourceId: "twitch", eventId: "gift-sub-upgraded" },
        { eventSourceId: "twitch", eventId: "follow" },
        { eventSourceId: "twitch", eventId: "raid" },
        { eventSourceId: "twitch", eventId: "viewer-arrived" },
        { eventSourceId: "twitch", eventId: "community-subs-gifted" },
        { eventSourceId: "twitch", eventId: "channel-reward-redemption" },
        { eventSourceId: "twitch", eventId: "viewer-arrived" },
        { eventSourceId: "twitch", eventId: "chat-message" },
        { eventSourceId: "twitch", eventId: "announcement" },
        { eventSourceId: "twitch", eventId: "whisper" },
        { eventSourceId: "firebot", eventId: "view-time-update" },
        { eventSourceId: "firebot", eventId: "currency-update" },
        { eventSourceId: "firebot", eventId: "viewer-created" },
        { eventSourceId: "streamloots", eventId: "purchase" },
        { eventSourceId: "streamloots", eventId: "redemption" },
        { eventSourceId: "streamlabs", eventId: "follow" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT, ComparisonType.CONTAINS, ComparisonType.MATCHES_REGEX],
    valueType: "text",
    predicate: (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        // normalize usernames
        const eventUsername = eventMeta.username ? eventMeta.username.toLowerCase() : "";
        const filterUsername = value ? value.toLowerCase() : "";

        switch (comparisonType) {
            case ComparisonType.IS:
                return eventUsername === filterUsername;
            case ComparisonType.IS_NOT:
                return eventUsername !== filterUsername;
            case ComparisonType.CONTAINS:
                return eventUsername.includes(filterUsername);
            case ComparisonType.MATCHES_REGEX: {
                const regex = new RegExp(filterUsername, "gi");
                return regex.test(eventUsername);
            }
            default:
                return false;
        }
    }
};