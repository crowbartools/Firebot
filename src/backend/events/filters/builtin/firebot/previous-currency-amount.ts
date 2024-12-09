import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:previous-currency-amount",
    name: "Previous Currency Amount",
    description: "Filter by the viewers previous currency amount",
    eventMetaKey: "previousCurrencyAmount",
    events: [
        { eventSourceId: "firebot", eventId: "currency-update" }
    ]
});

export default filter;