import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "metadataKey",
    description: "The metadata key associated with this event",
    events: ["firebot:viewer-metadata-updated"],
    type: "text",
    eventMetaKey: "metadataKey"
});