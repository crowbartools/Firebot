"use strict";

const { createEventDataVariable } = require("../variable-factory");

module.exports = createEventDataVariable({
    handle: "newCurrencyAmount",
    description: "The new amount of currency the viewer has",
    events: ["firebot:currency-update"],
    type: "number",
    eventMetaKey: "newCurrencyAmount"
});