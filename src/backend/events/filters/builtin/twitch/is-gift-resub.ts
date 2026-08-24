import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "twitch:is-gift-resub",
    name: "Gift Resub",
    description: "Filter by whether the resub was the result of a gift",
    events: [
        { eventSourceId: "twitch", eventId: "sub" }
    ],
    eventMetaKey: "isGiftResub",
    presetValues: () => [
        {
            value: "true",
            display: "True"
        },
        {
            value: "false",
            display: "False"
        }
    ]
});

export default filter;