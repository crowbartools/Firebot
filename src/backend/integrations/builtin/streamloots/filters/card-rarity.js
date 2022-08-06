"use strict";

const { ComparisonType } = require("../../../../../shared/filter-constants");

module.exports = {
    id: "streamloots:card-rarity",
    name: "Card Rarity",
    description: "Filter by the rarity of redeemed Streamloots Cards",
    events: [
        { eventSourceId: "streamloots", eventId: "redemption" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT],
    valueType: "preset",
    presetValues: async () => {
        return [
            {
                value: "common",
                display: "Common"
            },
            {
                value: "rare",
                display: "Rare"
            },
            {
                value: "epic",
                display: "Epic"
            },
            {
                value: "legendary",
                display: "Legendary"
            }
        ];
    },
    getSelectedValueDisplay: (filterSettings) => {

        const capitalize = ([first, ...rest]) =>
            first.toUpperCase() + rest.join("").toLowerCase();

        if (filterSettings.value == null) {
            return "[Not set]";
        }

        return capitalize(filterSettings.value);
    },
    predicate: (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const cardRarity = eventMeta.cardRarity;

        if (!cardRarity) {
            return false;
        }

        return comparisonType === ComparisonType.IS ? value === cardRarity : value !== cardRarity;
    }
};