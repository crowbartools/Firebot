"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:host-type",
    name: "Host Type",
    description: "Filter by whether a host is an autohost or a regular manual host.",
    events: [
        { eventSourceId: "twitch", eventId: "host" }
    ],
    comparisonTypes: [ComparisonType.IS],
    valueType: "preset",
    presetValues: () => {
        return [
            {
                value: "auto",
                display: "Auto"
            },
            {
                value: "manual",
                display: "Manual"
            }
        ];
    },
    getSelectedValueDisplay: (filterSettings) => {

        if (filterSettings.value == null) {
            return "Manual";
        }

        if (filterSettings.value === "auto") {
            return "Auto";
        }

        if (filterSettings.value === "manual") {
            return "Manual";
        }
    },
    predicate: (filterSettings, eventData) => {

        const { value } = filterSettings;
        const { eventMeta } = eventData;

        const isAutohost = eventMeta.auto === true;

        switch (value) {
        case "auto": {
            return isAutohost;
        }
        case "manual": {
            return !isAutohost;
        }
        default:
            return !isAutohost;
        }
    }
};