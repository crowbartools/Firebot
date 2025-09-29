import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "dynamicCountdownId",
    description: "The ID of the dynamic countdown widget",
    events: ["firebot:dynamic-countdown-finished"],
    type: "text",
    eventMetaKey: "dynamicCountdownWidgetId"
});