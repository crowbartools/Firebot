"use strict";

const { createEventDataVariable } = require("../variable-factory");

module.exports = createEventDataVariable({
    handle: "previousCurrencyAmount",
    description: "The previous amount of currency the viewer had",
    events: ["firebot:currency-update"],
    type: "number",
    eventMetaKey: "previousCurrencyAmount"
});