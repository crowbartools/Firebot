"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:skill-currency-type",
    name: "Currency Type",
    description: "Filter by the currency type spent on a Skill (Ember/Sparks)",
    events: [
        { eventSourceId: "mixer", eventId: "skill" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT],
    valueType: "preset",
    presetValues: () => {
        return [
            {
                value: "embers",
                display: "Embers"
            },
            {
                value: "sparks",
                display: "Sparks"
            }
        ];
    },
    getSelectedValueDisplay: (filterSettings) => {

        if (filterSettings.value == null) {
            return "[Not set]";
        }

        if (filterSettings.value === "embers") {
            return "Embers";
        }

        if (filterSettings.value === "sparks") {
            return "Sparks";
        }
    },
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let skill = eventMeta.data.skill;

        if (!skill) {
            return false;
        }

        switch (value) {
        case "embers": {
            let isEmbers = skill.currency === "Embers";
            return comparisonType === ComparisonType.IS ? isEmbers : !isEmbers;
        }
        case "sparks": {
            let isSparks = skill.currency === "Sparks";
            return comparisonType === ComparisonType.IS ? isSparks : !isSparks;
        }
        default:
            return false;
        }
    }
};