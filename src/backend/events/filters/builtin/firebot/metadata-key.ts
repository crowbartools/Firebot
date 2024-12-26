import { createTextFilter } from "../../filter-factory";

const filter = createTextFilter({
    id: "firebot:metadata-key",
    name: "Metadata Key",
    description: "Filters events based on the metadata key.",
    eventMetaKey: "metadataKey",
    events: [
        { eventSourceId: "firebot", eventId: "viewer-metadata-updated" }
    ]
});

export default filter;
