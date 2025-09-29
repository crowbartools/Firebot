import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "dynamicCountdownName",
    description: "The name of the dynamic countdown widget",
    events: ["firebot:dynamic-countdown-finished"],
    type: "text",
    eventMetaKey: "dynamicCountdownWidgetName"
});