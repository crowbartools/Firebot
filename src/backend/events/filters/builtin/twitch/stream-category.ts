import { createTextFilter } from "../../filter-factory";

const filter = createTextFilter({
    id: "firebot:category-changed",
    name: "Category",
    caseInsensitive: true,
    description: "The category that is currently selected to stream to.",
    eventMetaKey: "category",
    events: [
        { eventSourceId: "firebot", eventId: "category-changed" },
        { eventSourceId: "twitch", eventId: "category-changed" }
    ]
});

export default filter;