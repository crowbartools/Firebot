import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "customWidgetMessageData",
    description: "The data of the custom widget message",
    events: ["firebot:custom-widget-message-received"],
    type: "ALL",
    eventMetaKey: "customWidgetMessageData"
});