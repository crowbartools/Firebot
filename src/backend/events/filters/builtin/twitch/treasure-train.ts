import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:treasure-train",
    name: "Treasure Train",
    description: "Filter by whether the hype train is a Treasure Train.",
    events: [
        { eventSourceId: "twitch", eventId: "hype-train-end" },
        { eventSourceId: "twitch", eventId: "hype-train-progress" },
        { eventSourceId: "twitch", eventId: "hype-train-start" }
    ],
    eventMetaKey: "isTreasureTrain",
    presetValues: async () => [
        { value: "true", display: "True" },
        { value: "false", display: "False" }
    ]
});

export default filter;
