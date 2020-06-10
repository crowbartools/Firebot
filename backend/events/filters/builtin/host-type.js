"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:host-type",
    name: "Host Type",
    description: "Filter by whether a host is an autohost (Mixer native) or a regular manual host.",
    events: [
        { eventSourceId: "mixer", eventId: "hosted" }
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

        let { value } = filterSettings;
        let { eventMeta } = eventData;

        let isAutohost = eventMeta.auto === true;

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