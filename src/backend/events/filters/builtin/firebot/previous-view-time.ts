import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:previous-view-time",
    name: "Previous View Time",
    description: "Filter a viewers previous view time (hours)",
    eventMetaKey: "previousViewTime",
    events: [
        { eventSourceId: "firebot", eventId: "view-time-update" }
    ]
});

export default filter;