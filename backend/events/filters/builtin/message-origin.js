"use strict";

module.exports = {
    id: "firebot:message-origin",
    name: "Message Origin",
    description: "Filter by whether or not the message came from the streamers own channel or a costream channel",
    events: [
        { eventSourceId: "mixer", eventId: "chat-message" }
    ],
    comparisonTypes: ["is from"],
    valueType: "preset",
    presetValues: () => {
        return [
            {
                value: "own",
                display: "Own Channel"
            },
            {
                value: "other",
                display: "Costream Channel"
            }
        ];
    },
    getSelectedValueDisplay: filterSettings => {
        if (filterSettings.value === "own") {
            return "Own Channel";
        } else if (filterSettings.value === "other") {
            return "Costream Channel";
        }

        return "[Not set]";
    },
    predicate: (filterSettings, eventData) => {

        let { value } = filterSettings;
        let { eventMeta } = eventData;

        let fromStreamerChannel = eventMeta.originatedInStreamerChannel === true;

        if (value === "own") {
            return fromStreamerChannel;
        } else if (value === "other") {
            return !fromStreamerChannel;
        }

        return true;
    }
};