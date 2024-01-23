import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "previousCurrencyAmount",
    description: "The previous amount of currency the viewer had",
    events: ["firebot:currency-update"],
    type: "number",
    eventMetaKey: "previousCurrencyAmount"
});