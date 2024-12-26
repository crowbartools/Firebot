import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:golden-kappa-train",
    name: "Golden Kappa Train",
    description: "Filter by whether the hype train is a Golden Kappa Train.",
    events: [
        { eventSourceId: "twitch", eventId: "hype-train-end" },
        { eventSourceId: "twitch", eventId: "hype-train-progress" },
        { eventSourceId: "twitch", eventId: "hype-train-start" }
    ],
    eventMetaKey: "isGoldenKappaTrain",
    presetValues: async () => [
        { value: "true", display: "True" },
        { value: "false", display: "False" }
    ]
});

export default filter;
