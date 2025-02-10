import { createTextFilter } from "../../filter-factory";

const filter = createTextFilter({
    id: "firebot:custom-variable-name",
    name: "Custom Variable Name",
    description: "Filter to a Custom Variable by Name",
    eventMetaKey: ({eventId}) => {
        if (eventId === "custom-variable-set") {
            return "createdCustomVariableName";
        }
        return "expiredCustomVariableName";
    },
    events: [
        { eventSourceId: "firebot", eventId: "custom-variable-set" },
        { eventSourceId: "firebot", eventId: "custom-variable-expired" }
    ]
});

export default filter;