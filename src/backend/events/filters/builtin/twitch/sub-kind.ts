import { EventFilter, PresetValue } from "../../../../../types/events";
import { ComparisonType } from "../../../../../shared/filter-constants";

const filter: EventFilter = {
    id: "firebot:sub-kind",
    name: "Kind of Sub",
    description: "Filter by the kind of sub (resub vs first sub)",
    events: [
        { eventSourceId: "twitch", eventId: "sub" }
    ],
    comparisonTypes: [ComparisonType.IS],
    valueType: "preset",
    presetValues: () => [
        {
            value: "first",
            display: "First Sub"
        },
        {
            value: "resub",
            display: "Resub"
        }
    ],
    getSelectedValueDisplay: (filterSettings, presetValues: PresetValue[]) => {
        return presetValues
            .find(pv => pv.value === filterSettings.value)?.display ?? "[Not Set]";
    },
    predicate: (filterSettings, eventData) => {
        const { value } = filterSettings;
        const { eventMeta } = eventData;

        if (value == null) {
            return true;
        }

        const isResub = eventMeta.isResub;
        const expectingResub = value === "resub";

        return isResub === expectingResub;
    }
};

export default filter;