import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:gift-duration",
    name: "Gift Duration",
    description: "Filter by the duration of the gift sub (in months)",
    eventMetaKey: "giftDuration",
    events: [
        { eventSourceId: "twitch", eventId: "subs-gifted" }
    ]
});

export default filter;