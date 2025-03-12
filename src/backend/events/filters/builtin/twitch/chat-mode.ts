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
            .find(pv => pv.value === filterSettings.value || (filterSettings.value === "r9kbeta" && pv.value === "uniquechat"))?.display ?? "[Not Set]";
    },
    predicate: async (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;
        // Unique chat previously used 'r9kbeta' on PubSub; became 'uniquechat' on EventSub.
        const ucValue = value === "r9kbeta" ? "uniquechat" : value;

        const chatModes = eventMeta.chatMode as string;

        switch (comparisonType) {
            case ComparisonType.IS:
                return chatModes.includes(ucValue);
            case ComparisonType.IS_NOT:
                return !chatModes.includes(ucValue);
            default:
                return false;
        }
    }
};

export default filter;