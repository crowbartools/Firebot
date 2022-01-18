"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:chatmodesetting",
    name: "Setting",
    description: "Filter by a chat mode's setting",
    events: [
        { eventSourceId: "twitch", eventId: "chat-mode-changed" }
    ],
    comparisonTypes: [ComparisonType.IS],
    valueType: "preset",
    presetValues: () => {
        return [
            {
                value: "enabled",
                display: "Enabled"
            },
            {
                value: "disabled",
                display: "Disabled"
            }
        ];
    },
    getSelectedValueDisplay: (filterSettings) => {
        switch (filterSettings.value) {
        case "enabled":
            return "Enabled";
        case "disabled":
            return "Disabled";
        default:
            return "[Not set]";
        }
    },
    predicate: async (filterSettings, eventData) => {

        const { value } = filterSettings;
        const { eventMeta } = eventData;

        const chatModeDisabled = eventMeta.chatMode.includes("off");

        switch (value) {
        case "enabled": {
            return !chatModeDisabled;
        }
        case "disabled": {
            return chatModeDisabled;
        }
        default:
            return chatModeDisabled;
        }
    }
};