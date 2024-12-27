import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:bits-badge-tier",
    name: "Bits Badge Tier",
    description: "Filter by the tier of the bits badge that was unlocked (100, 1000, 5000, etc.)",
    events: [
        { eventSourceId: "twitch", eventId: "bits-badge-unlocked" }
    ],
    eventMetaKey: "badgeTier"
});

export default filter;