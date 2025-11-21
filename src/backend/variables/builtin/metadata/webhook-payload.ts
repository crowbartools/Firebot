import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "webhookPayload",
    description: "The payload of the webhook",
    events: ["firebot:webhook-received"],
    type: "ALL",
    eventMetaKey: "webhookPayload"
});