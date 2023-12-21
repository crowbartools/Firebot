"use strict";

module.exports = {
    id: "streamloots:chest-quantity",
    name: "Chest Quantity",
    description: "Filter by the number of StreamLoots chests purchased/gifted.",
    events: [
        { eventSourceId: "streamloots", eventId: "purchase" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const quantity = eventMeta.quantity;

        if (quantity === undefined || quantity === null) {
            return false;
        }

        switch (comparisonType) {
            case "is": {
                return quantity === value;
            }
            case "is not": {
                return quantity !== value;
            }
            case "less than": {
                return quantity < value;
            }
            case "greater than": {
                return quantity > value;
            }
            default:
                return false;
        }
    }
};