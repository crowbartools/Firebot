import { createTextFilter } from "../../filter-factory";

const filter = createTextFilter({
    id: "firebot:username",
    name: "Username",
    caseInsensitive: true,
    description: "Filter to a specific username",
    eventMetaKey: "username",
    events: [
        { eventSourceId: "twitch", eventId: "cheer" },
        { eventSourceId: "twitch", eventId: "bits-badge-unlocked" },
        { eventSourceId: "twitch", eventId: "subs-gifted" },
        { eventSourceId: "twitch", eventId: "sub" },
        { eventSourceId: "twitch", eventId: "prime-sub-upgraded" },
        { eventSourceId: "twitch", eventId: "gift-sub-upgraded" },
        { eventSourceId: "twitch", eventId: "follow" },
        { eventSourceId: "twitch", eventId: "raid" },
        { eventSourceId: "twitch", eventId: "viewer-arrived" },
        { eventSourceId: "twitch", eventId: "community-subs-gifted" },
        { eventSourceId: "twitch", eventId: "channel-reward-redemption" },
        { eventSourceId: "twitch", eventId: "viewer-arrived" },
        { eventSourceId: "twitch", eventId: "chat-message" },
        { eventSourceId: "twitch", eventId: "announcement" },
        { eventSourceId: "twitch", eventId: "whisper" },
        { eventSourceId: "firebot", eventId: "view-time-update" },
        { eventSourceId: "firebot", eventId: "currency-update" },
        { eventSourceId: "firebot", eventId: "viewer-created" },
        { eventSourceId: "firebot", eventId: "viewer-rank-updated" },
        { eventSourceId: "streamloots", eventId: "purchase" },
        { eventSourceId: "streamloots", eventId: "redemption" },
        { eventSourceId: "streamlabs", eventId: "follow" }
    ]
});

export default filter;