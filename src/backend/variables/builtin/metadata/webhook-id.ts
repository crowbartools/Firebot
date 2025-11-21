import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "webhookId",
    description: "The ID of the webhook",
    events: ["firebot:webhook-received"],
    type: "text",
    eventMetaKey: "webhookId"
});