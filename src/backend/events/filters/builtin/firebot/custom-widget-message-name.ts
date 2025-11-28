import { createTextFilter } from "../../filter-factory";

const filter = createTextFilter({
    id: "firebot:custom-widget-message-name",
    name: "Message Name",
    description: "Filter to specific message name",
    events: [
        { eventSourceId: "firebot", eventId: "custom-widget-message-received" }
    ],
    eventMetaKey: "customWidgetMessageName"
});

export default filter;