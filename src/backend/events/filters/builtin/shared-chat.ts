import { ComparisonType } from "../../../../shared/filter-constants";

module.exports = {
    id: "firebot:is-shared-chat-message",
    name: "Shared Chat",
    description: "Filter by whether the event was triggered by a shared chat message",
    events: [
        { eventSourceId: "twitch", eventId: "chat-message" },
        { eventSourceId: "twitch", eventId: "announcement" },
        { eventSourceId: "twitch", eventId: "first-time-chat" },
        { eventSourceId: "twitch", eventId: "viewer-arrived" }
    ],
    comparisonTypes: [ComparisonType.IS],
    valueType: "preset",
    presetValues: () => {
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
    getSelectedValueDisplay: (filterSettings) => {

        if (filterSettings.value == null) {
            return "False";
        }

        return filterSettings.value === "true" ? "True" : "False";
    },
    predicate: (filterSettings, eventData) => {

        const { value } = filterSettings;
        const { eventMeta } = eventData;

        const isShared = eventMeta.chatMessage.isSharedChatMessage;

        return value === "true" ? isShared : !isShared;
    }
};