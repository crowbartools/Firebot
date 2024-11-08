import { EventFilter } from "../../../../../types/events";

const { ComparisonType } = require("../../../../../shared/filter-constants");

const filter: EventFilter = {
    id: "streamloots:gift-purchase",
    name: "Chest Purchase",
    description: "Filter by whether or not the StreamLoots chest purchase was a gift.",
    events: [
        { eventSourceId: "streamloots", eventId: "purchase" }
    ],
    comparisonTypes: [ComparisonType.IS],
    valueType: "preset",
    presetValues: async () => {
        return [
            {
                value: "true",
                display: "A Gift"
            },
            {
                value: "false",
                display: "Not A Gift"
            }
        ];
    },
    getSelectedValueDisplay: (filterSettings) => {

        if (filterSettings.value == null) {
            return "[Not set]";
        }

        return filterSettings.value === "true" ? "A Gift" : "Not A Gift";
    },
    predicate: (filterSettings, eventData) => {

        const { value } = filterSettings;
        const { eventMeta } = eventData;

        const filterGiftValue = value === "true";

        const isGift = eventMeta.giftee != null;

        return filterGiftValue === isGift;
    }
};

module.exports = filter;