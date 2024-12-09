import { createTextFilter } from "../../../../events/filters/filter-factory";

const filter = createTextFilter({
    id: "streamloots:card-name",
    name: "Card Name",
    description: "Filter by StreamLoots Card name",
    events: [
        { eventSourceId: "streamloots", eventId: "redemption" }
    ],
    eventMetaKey: "cardName",
    caseInsensitive: true
});

module.exports = filter;