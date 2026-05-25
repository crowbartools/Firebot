import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:watch-streak-count",
    name: "Watch Streak Count",
    description: "Filter by the number of consecutive streams watched",
    eventMetaKey: "streakCount",
    events: [
        { eventSourceId: "twitch", eventId: "watch-streak" }
    ]
});

export default filter;