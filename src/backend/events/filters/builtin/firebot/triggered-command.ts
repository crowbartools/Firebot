import { ComparisonType } from "../../../../../shared/filter-constants";
import { EventFilter } from "../../../../../types/events";

const filter: EventFilter = {
    id: "firebot:triggered-command",
    name: "Triggered Command",
    description: "Filter by whether or not the chat message triggered a command",
    events: [
        { eventSourceId: "twitch", eventId: "chat-message" },
        { eventSourceId: "twitch", eventId: "action" }
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
    valueIsStillValid: filterSettings => filterSettings.value != null,
    predicate: async (filterSettings, eventData) => {
        const { value } = filterSettings;
        return eventData.eventMeta?.triggeredCommand?.toString() === value;
    }
};

export default filter;