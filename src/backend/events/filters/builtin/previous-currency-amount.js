"use strict";

const { buildNumberFilter } = require("../filter-factory");

module.exports = buildNumberFilter({
    id: "firebot:previous-currency-amount",
    name: "Previous Currency Amount",
    description: "Filter by the viewers previous currency amount",
    eventMetaKey: "previousCurrencyAmount",
    events: [
        { eventId: "firebot", eventSourceId: "currency-update" }
    ]
});