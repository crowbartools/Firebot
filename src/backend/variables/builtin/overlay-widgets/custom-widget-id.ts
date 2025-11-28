import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "customWidgetId",
    description: "The ID of the custom widget",
    events: ["firebot:custom-widget-message-received"],
    type: "text",
    eventMetaKey: "customWidgetId"
});