import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:channel-goal-type",
    name: "Channel Goal Type",
    description: "Filter by the type of channel goal",
    events: [
        { eventSourceId: "twitch", eventId: "channel-goal-begin" },
        { eventSourceId: "twitch", eventId: "channel-goal-progress" },
        { eventSourceId: "twitch", eventId: "channel-goal-end" }
    ],
    eventMetaKey: "type",
    presetValues: () => [
        { value: "follow", display: "Follower" },
        { value: "new_subscription_count", display: "New Subs" },
        { value: "subscription_count", display: "Total Subs" },
        { value: "new_subscription", display: "New Sub Points" },
        { value: "subscription", display: "Total Sub Points" }
    ]
});

export default filter;