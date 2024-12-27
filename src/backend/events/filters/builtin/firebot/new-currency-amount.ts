import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:new-currency-amount",
    name: "New Currency Amount",
    description: "Filter by the viewers new currency amount",
    eventMetaKey: "newCurrencyAmount",
    events: [
        { eventSourceId: "firebot", eventId: "currency-update" }
    ]
});

export default filter;