import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:gift-count",
    name: "Gift Count",
    description: "Filter by the number of subs gifted",
    eventMetaKey: "subCount",
    events: [
        { eventSourceId: "twitch", eventId: "community-subs-gifted" }
    ]
});

export default filter;