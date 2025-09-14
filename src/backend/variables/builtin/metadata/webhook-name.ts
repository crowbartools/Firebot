import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "webhookName",
    description: "The name of the webhook",
    events: ["firebot:webhook-received"],
    type: "text",
    eventMetaKey: "webhookName"
});