import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:sub-months",
    name: "Months Subbed",
    description: "Filter by the total number of months the user has been subscribed",
    eventMetaKey: "totalMonths",
    events: [
        { eventSourceId: "twitch", eventId: "sub" }
    ]
});

export default filter;