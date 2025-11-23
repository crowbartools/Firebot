import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "customWidgetMessageName",
    description: "The name of the custom widget message",
    events: ["firebot:custom-widget-message-received"],
    type: "text",
    eventMetaKey: "customWidgetMessageName"
});