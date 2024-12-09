import { createTextOrNumberFilter } from "../../filter-factory";

const filter = createTextOrNumberFilter({
    id: "firebot:metadata-value",
    name: "Metadata Value",
    description: "Filters events based on the metadata value. Only works with text or number value types.",
    eventMetaKey: "metadataValue",
    events: [
        { eventSourceId: "firebot", eventId: "viewer-metadata-updated" }
    ]
});

export default filter;
