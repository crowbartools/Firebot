"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:is-anonymous",
    name: "Anonymous",
    description: "Filter by whether the event was triggered by an anonymous user",
    events: [
        { eventSourceId: "twitch", eventId: "cheer" },
        { eventSourceId: "twitch", eventId: "subs-gifted" },
        { eventSourceId: "twitch", eventId: "community-subs-gifted" }
    ],
    comparisonTypes: [ComparisonType.IS],
    valueType: "preset",
    presetValues: () => {
        return [
            {
                value: "true",
                display: "True"
            },
            {
                value: "false",
                display: "False"
            }
        ];
    },
    getSelectedValueDisplay: (filterSettings) => {

        if (filterSettings.value == null) {
            return "False";
        }

        return filterSettings.value === "true" ? "True" : "False";
    },
    predicate: (filterSettings, eventData) => {

        const { value } = filterSettings;
        const { eventMeta } = eventData;

        const isAnonymous = eventMeta.isAnonymous === true;

        return value === "true" ? isAnonymous : !isAnonymous;
    }
};