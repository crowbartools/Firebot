import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:lifetime-gift-count",
    name: "Lifetime Gift Count",
    description: "Filter by the total number of subs gifted by this user over the lifetime of the channel",
    eventMetaKey: "lifetimeGiftCount",
    events: [
        { eventSourceId: "twitch", eventId: "subs-gifted" },
        { eventSourceId: "twitch", eventId: "community-subs-gifted" }
    ]
});

export default filter;