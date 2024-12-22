import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:rank-transition-type",
    name: "Rank Transition Type",
    description: "Filter to a given rank transition type (promotion or demotion)",
    events: [
        { eventSourceId: "firebot", eventId: "viewer-rank-updated" }
    ],
    eventMetaKey: (eventData, filterSettings) => {
        if (filterSettings.value === "Promotion") {
            return "isPromotion";
        }
        if (filterSettings.value === "Demotion") {
            return "isDemotion";
        }
        return "";
    },
    presetValues: () => [
        { value: "Promotion", display: "Promotion" },
        { value: "Demotion", display: "Demotion" }
    ]
});

export default filter;