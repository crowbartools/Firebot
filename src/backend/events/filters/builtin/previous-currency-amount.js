"use strict";

const { createNumberFilter } = require("../filter-factory");

module.exports = createNumberFilter({
    id: "firebot:previous-currency-amount",
    name: "Previous Currency Amount",
    description: "Filter by the viewers previous currency amount",
    eventMetaKey: "previousCurrencyAmount",
    events: [
        { eventSourceId: "firebot", eventId: "currency-update" }
    ]
});