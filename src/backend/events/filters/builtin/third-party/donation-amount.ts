import { createNumberFilter } from "../../filter-factory";

const filter = createNumberFilter({
    id: "firebot:donation-amount",
    name: "Donation Amount",
    description: "Filter by the amount of donation from StreamLabs/Tipeee/ExtraLife",
    eventMetaKey: "donationAmount",
    events: [
        { eventSourceId: "streamlabs", eventId: "donation" },
        { eventSourceId: "streamlabs", eventId: "eldonation" },
        { eventSourceId: "extralife", eventId: "donation" },
        { eventSourceId: "tipeeestream", eventId: "donation" },
        { eventSourceId: "streamelements", eventId: "donation" }
    ]
});

export default filter;