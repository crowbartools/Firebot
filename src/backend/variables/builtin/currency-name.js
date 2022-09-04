"use strict";

const { createEventDataVariable } = require("../variable-factory");

module.exports = createEventDataVariable({
    handle: "currencyName",
    description: "The name of the currency",
    events: ["firebot:currency-update"],
    type: "text",
    eventMetaKey: "currencyName"
});