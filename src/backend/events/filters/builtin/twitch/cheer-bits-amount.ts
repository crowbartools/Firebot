import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:cheerbitsamount",
    name: "Cheer Bits Amount",
    description: "Filter by the amount of bits in a Cheer",
    eventMetaKey: "bits",
    events: [
        { eventSourceId: "twitch", eventId: "cheer" }
    ]
});

export default filter;