import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "webhookHeaders",
    description: "The headers of the webhook",
    events: ["firebot:webhook-received"],
    type: "text",
    eventMetaKey: "webhookHeaders"
});