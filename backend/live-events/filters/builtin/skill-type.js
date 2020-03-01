"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:skill-type",
    name: "Skill Type",
    description: "Filter by Skill type",
    events: [
        { eventSourceId: "mixer", eventId: "skill" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT],
    valueType: "preset",
    presetValues: () => {
        return [
            {
                value: "sticker",
                display: "a Sticker"
            },
            {
                value: "gif",
                display: "a GIF"
            }
        ];
    },
    getSelectedValueDisplay: (filterSettings) => {

        if (filterSettings.value == null) {
            return "[Not set]";
        }

        if (filterSettings.value === "sticker") {
            return "a Sticker";
        }

        if (filterSettings.value === "gif") {
            return "a GIF";
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
        case "sticker":
            return comparisonType === ComparisonType.IS ? skill.isSticker : !skill.isSticker;
        case "gif":
            return comparisonType === ComparisonType.IS ? skill.isGif : !skill.isGif;
        default:
            return false;
        }
    }
};