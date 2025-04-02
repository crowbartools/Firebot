import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:chatmodesetting",
    name: "Setting",
    description: "Filter by a chat mode's setting",
    events: [
        { eventSourceId: "twitch", eventId: "chat-mode-changed" }
    ],
    eventMetaKey: "chatModeState",
    presetValues: async () => [
        {
            value: "enabled",
            display: "Enabled"
        },
        {
            value: "disabled",
            display: "Disabled"
        }
    ]
});

export default filter;