import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:sub-kind",
    name: "Kind of Sub",
    description: "Filter by the kind of sub (resub vs first sub)",
    events: [
        { eventSourceId: "twitch", eventId: "sub" }
    ],
    eventMetaKey: "isResub",
    presetValues: () => [
        {
            value: "first",
            display: "First Sub"
        },
        {
            value: "resub",
            display: "Resub"
        }
    ]
});

export default filter;