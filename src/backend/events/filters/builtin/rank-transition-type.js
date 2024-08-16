"use strict";

module.exports = {
    id: "firebot:rank-transition-type",
    name: "Rank Transition Type",
    description: "Filter to a given rank transition type (promotion or demotion)",
    events: [
        { eventSourceId: "firebot", eventId: "viewer-rank-updated" }
    ],
    comparisonTypes: ["is"],
    valueType: "preset",
    presetValues: () => {
        return [
            { value: "Promotion", display: "Promotion" },
            { value: "Demotion", display: "Demotion" }
        ];
    },
    valueIsStillValid: () => {
        return true;
    },
    getSelectedValueDisplay: (filterSettings) => {
        return filterSettings.value;
    },

    predicate: async (filterSettings, eventData) => {
        const { value } = filterSettings;
        const { eventMeta } = eventData;

        const { isPromotion, isDemotion } = eventMeta;

        return value === "Promotion" ?
            isPromotion :
            value === "Demotion" ?
                isDemotion :
                false;
    }
};