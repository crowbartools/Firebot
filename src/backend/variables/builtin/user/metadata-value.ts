import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "metadataValue",
    description: "The metadata value associated with this event",
    events: ["firebot:viewer-metadata-updated"],
    type: "ALL",
    eventMetaKey: "metadataValue"
});