import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "webhookRawPayload",
    description: "The raw payload of the webhook",
    events: ["firebot:webhook-received"],
    type: "text",
    eventMetaKey: "webhookRawPayload"
});