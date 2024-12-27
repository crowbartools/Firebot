import { createNumberFilter } from "../../../../events/filters/filter-factory";

const filter = createNumberFilter({
    id: "streamloots:chest-quantity",
    name: "Chest Quantity",
    description: "Filter by the number of StreamLoots chests purchased/gifted.",
    events: [
        { eventSourceId: "streamloots", eventId: "purchase" }
    ],
    eventMetaKey: "quantity"
});

module.exports = filter;