"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:resub-shared",
    name: "Resub Shared",
    description: "Filter by whether or not a resubscription was shared by the viewer.",
    events: [
        { eventSourceId: "mixer", eventId: "resub" }
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

        if (filterSettings.value === "true") {
            return "True";
        }

        if (filterSettings.value === "false") {
            return "False";
        }
    },
    predicate: (filterSettings, eventData) => {

        let { value } = filterSettings;
        let { eventMeta } = eventData;

        let shared = eventMeta.shared;

        switch (value) {
        case "true": {
            return shared === true;
        }
        case "false": {
            return shared === false;
        }
        default:
            return false;
        }
    }
};