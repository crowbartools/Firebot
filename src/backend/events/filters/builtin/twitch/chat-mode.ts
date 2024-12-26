import { EventFilter } from "../../../../../types/events";
import { ComparisonType } from "../../../../../shared/filter-constants";

const filter: EventFilter = {
    id: "firebot:chatmode",
    name: "Chat Mode",
    description: "Filter by a chat mode",
    events: [
        { eventSourceId: "twitch", eventId: "chat-mode-changed" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT],
    valueType: "preset",
    presetValues: async () => {
        return [
            {
                value: "emoteonly",
                display: "Emote Only"
            },
            {
                value: "followers",
                display: "Followers"
            },
            {
                value: "subscribers",
                display: "Subscribers Only"
            },
            {
                value: "slow",
                display: "Slow"
            },
            {
                value: "uniquechat",
                display: "Unique Chat"
            }
        ];
    },
    getSelectedValueDisplay: async (filterSettings) => {
        return (await filter.presetValues())
            .find(pv => pv.value === filterSettings.value)?.display ?? "[Not Set]";
    },
    predicate: async (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const chatModes = eventMeta.chatMode as string;

        switch (comparisonType) {
            case ComparisonType.IS:
                return chatModes.includes(value);
            case ComparisonType.IS_NOT:
                return !chatModes.includes(value);
            default:
                return false;
        }
    }
};

export default filter;