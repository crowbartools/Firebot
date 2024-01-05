"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:sub-kind",
    name: "Kind of Sub",
    description: "Filter by the kind of sub (resub vs first sub)",
    events: [
        { eventSourceId: "twitch", eventId: "sub" }
    ],
    comparisonTypes: [ComparisonType.IS],
    valueType: "preset",
    presetValues: () => {
        return [
            {
                value: "first",
                display: "First Sub"
            },
            {
                value: "resub",
                display: "Resub"
            }
        ];
    },
    getSelectedValueDisplay: (filterSettings) => {
        switch (filterSettings.value) {
            case "first":
                return "First Sub";
            case "resub":
                return "Resub";
            default:
                return "[Not set]";
        }
    },
    predicate: (filterSettings, eventData) => {

        const { value } = filterSettings;
        const { eventMeta } = eventData;

        if (value == null) {
            return true;
        }

        const isResub = eventMeta.isResub;
        const expectingResub = value === 'resub';

        return isResub === expectingResub;
    }
};