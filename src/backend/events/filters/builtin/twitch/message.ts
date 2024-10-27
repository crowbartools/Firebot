import { createTextFilter } from "../../filter-factory";

const filter = createTextFilter({
    id: "firebot:message-text",
    name: "Message Text",
    description: "Filter based on chat message text",
    eventMetaKey: "messageText",
    events: [
        { eventSourceId: "twitch", eventId: "chat-message" },
        { eventSourceId: "twitch", eventId: "announcement" }
    ]
});

export default filter;
