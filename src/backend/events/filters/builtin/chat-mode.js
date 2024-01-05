"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:chatmode",
    name: "Chat Mode",
    description: "Filter by a chat mode",
    events: [
        { eventSourceId: "twitch", eventId: "chat-mode-changed" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT],
    valueType: "preset",
    presetValues: () => {
        return [
            {
                value: "emoteonly",
                display: "Emote Only"
            },
            {
                value: "followers",
                display: "Followers"
            },
            {
                value: "subscribers",
                display: "Subscribers Only"
            },
            {
                value: "slow",
                display: "Slow"
            },
            {
                value: "r9kbeta",
                display: "Unique Chat"
            }
        ];
    },
    getSelectedValueDisplay: (filterSettings) => {
        switch (filterSettings.value) {
            case "emoteonly":
                return "Emote Only";
            case "followers":
                return "Followers";
            case "subscribers":
                return "Subscribers Only";
            case "slow":
                return "Slow";
            case "r9kbeta":
                return "Unique Chat";
            default:
                return "[Not set]";
        }
    },
    predicate: async (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        switch (comparisonType) {
            case "is":
                return eventMeta.chatMode.includes(value);
            case "is not":
                return !eventMeta.chatMode.includes(value);
            default:
                return false;
        }
    }
};