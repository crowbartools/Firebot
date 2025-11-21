import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:shared-train",
    name: "Shared Train",
    description: "Filter by whether the hype train is shared with other broadcasters.",
    events: [
        { eventSourceId: "twitch", eventId: "hype-train-end" },
        { eventSourceId: "twitch", eventId: "hype-train-progress" },
        { eventSourceId: "twitch", eventId: "hype-train-start" }
    ],
    eventMetaKey: "isSharedTrain",
    presetValues: async () => [
        { value: "true", display: "True" },
        { value: "false", display: "False" }
    ]
});

export default filter;
