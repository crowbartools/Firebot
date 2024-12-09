import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:new-view-time",
    name: "New View Time",
    description: "Filter a viewers new view time (hours)",
    eventMetaKey: "newViewTime",
    events: [
        { eventSourceId: "firebot", eventId: "view-time-update" }
    ]
});

export default filter;