"use strict";

const { ComparisonType } = require("../../../../../shared/filter-constants");

module.exports = {
    id: "streamloots:card-name",
    name: "Card Name",
    description: "Filter by StreamLoots Card name",
    events: [
        { eventSourceId: "streamloots", eventId: "redemption" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT, ComparisonType.CONTAINS, ComparisonType.MATCHES_REGEX],
    valueType: "text",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let cardName = eventMeta.cardName;

        if (!cardName) {
            return false;
        }

        cardName = cardName.toLowerCase();

        let filterCardName = value && value.toLowerCase();

        switch (comparisonType) {
        case ComparisonType.IS:
            return cardName === filterCardName;
        case ComparisonType.IS_NOT:
            return cardName !== filterCardName;
        case ComparisonType.CONTAINS:
            return cardName.includes(filterCardName);
        case ComparisonType.MATCHES_REGEX: {
            let regex = new RegExp(filterCardName, "gi");
            return regex.test(cardName);
        }
        default:
            return false;
        }
    }
};