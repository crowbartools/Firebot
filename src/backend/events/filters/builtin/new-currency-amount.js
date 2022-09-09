"use strict";

const { createNumberFilter } = require("../filter-factory");

module.exports = createNumberFilter({
    id: "firebot:new-currency-amount",
    name: "New Currency Amount",
    description: "Filter by the viewers new currency amount",
    events: [
        { eventSourceId: "firebot", eventId: "currency-update" }
    ],
    eventMetaKey: "newCurrencyAmount"
});