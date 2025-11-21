import { ComparisonType } from "../../../../../shared/filter-constants";
import { EventFilter } from "../../../../../types/events";
import twitchStreamInfoManager from "../../../../streaming-platforms/twitch/stream-info-manager";

const filter: EventFilter = {
    id: "firebot:channel-live",
    name: "Channel is Live",
    description: "Filter by whether or not channel is live",
    events: [
        { eventSourceId: "firebot", eventId: "category-changed" },
        { eventSourceId: "twitch", eventId: "announcement" },
        { eventSourceId: "twitch", eventId: "bits-badge-unlocked" },
        { eventSourceId: "twitch", eventId: "category-changed" },
        { eventSourceId: "twitch", eventId: "channel-reward-redemption" },
        { eventSourceId: "twitch", eventId: "chat-message" },
        { eventSourceId: "twitch", eventId: "chat-mode-changed" },
        { eventSourceId: "twitch", eventId: "cheer" },
        { eventSourceId: "twitch", eventId: "community-subs-gifted" },
        { eventSourceId: "twitch", eventId: "first-time-chat" },
        { eventSourceId: "twitch", eventId: "gift-sub-upgraded" },
        { eventSourceId: "twitch", eventId: "hype-train-end" },
        { eventSourceId: "twitch", eventId: "hype-train-progress" },
        { eventSourceId: "twitch", eventId: "hype-train-start" },
        { eventSourceId: "twitch", eventId: "prime-sub-upgraded" },
        { eventSourceId: "twitch", eventId: "raid" },
        { eventSourceId: "twitch", eventId: "raid-sent-off" },
        { eventSourceId: "twitch", eventId: "sub" },
        { eventSourceId: "twitch", eventId: "subs-gifted" },
        { eventSourceId: "twitch", eventId: "viewer-arrived" }
    ],
    comparisonTypes: [ComparisonType.IS],
    valueType: "preset",
    presetValues: async () => {
        return [
            {
                value: "true",
                display: "True"
            },
            {
                value: "false",
                display: "False"
            }
        ];
    },
    predicate: async (filterSettings) => {
        const { value } = filterSettings;
        const { isLive } = twitchStreamInfoManager.streamInfo;

        return isLive.toString() === value;
    }
};

export default filter;