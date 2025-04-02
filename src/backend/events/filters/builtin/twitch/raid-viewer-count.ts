import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:raid-viewer-count",
    name: "Raid Viewer Count",
    description: "Filter by how many viewers have been brought or are being sent over by the raid",
    eventMetaKey: "viewerCount",
    events: [
        { eventSourceId: "twitch", eventId: "raid" },
        { eventSourceId: "twitch", eventId: "raid-sent-off" }
    ]
});

export default filter;