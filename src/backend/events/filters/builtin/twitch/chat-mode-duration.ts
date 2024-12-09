import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:chatmodeduration",
    name: "Duration",
    description: "Filter by a chat mode's duration (only for Slow (seconds) and Follower (minutes))",
    eventMetaKey: "duration",
    events: [
        { eventSourceId: "twitch", eventId: "chat-mode-changed" }
    ]
});

export default filter;