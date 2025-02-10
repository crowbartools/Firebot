import { createTextFilter } from "../../filter-factory";

const filter = createTextFilter({
    id: "firebot:donationfrom",
    name: "Donation From",
    caseInsensitive: true,
    description: "Filter to a specific donation sender",
    eventMetaKey: "from",
    events: [
        { eventSourceId: "streamlabs", eventId: "donation" },
        { eventSourceId: "streamlabs", eventId: "eldonation" },
        { eventSourceId: "extralife", eventId: "donation" },
        { eventSourceId: "tipeeestream", eventId: "donation" },
        { eventSourceId: "streamelements", eventId: "donation" }
    ]
});

export default filter;