"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:category-changed",
    name: "Category",
    description: "The category that is currently selected to stream to.",
    events: [
        { eventSourceId: "firebot", eventId: "category-changed" },
        { eventSourceId: "twitch", eventId: "category-changed" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT, ComparisonType.CONTAINS, ComparisonType.MATCHES_REGEX],
    valueType: "text",
    predicate: (filterSettings, eventData) => {
        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const eventCategory = eventMeta.category ? eventMeta.category.toLowerCase() : "";
        const filterCategory = value ? value.toLowerCase() : "";

        switch (comparisonType) {
            case ComparisonType.IS:
                return eventCategory === filterCategory;
            case ComparisonType.IS_NOT:
                return eventCategory !== filterCategory;
            case ComparisonType.CONTAINS:
                return eventCategory.includes(filterCategory);
            case ComparisonType.MATCHES_REGEX: {
                const regex = new RegExp(filterCategory, "gi");
                return regex.test(eventCategory);
            }
            default:
                return false;
        }
    }
};