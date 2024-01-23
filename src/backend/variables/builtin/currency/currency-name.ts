import { createEventDataVariable } from "../../variable-factory";

export default createEventDataVariable({
    handle: "currencyName",
    description: "The name of the currency",
    events: ["firebot:currency-update"],
    type: "text",
    eventMetaKey: "currencyName"
});