import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "newCurrencyAmount",
    description: "The new amount of currency the viewer has",
    events: ["firebot:currency-update"],
    type: "number",
    eventMetaKey: "newCurrencyAmount"
});