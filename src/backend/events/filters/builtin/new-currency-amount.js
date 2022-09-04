"use strict";

const { buildNumberFilter } = require("../filter-factory");

module.exports = buildNumberFilter({
    id: "firebot:new-currency-amount",
    name: "New Currency Amount",
    description: "Filter by the viewers new currency amount",
    events: [
        { eventId: "firebot", eventSourceId: "currency-update" }
    ],
    eventMetaKey: "newCurrencyAmount"
});