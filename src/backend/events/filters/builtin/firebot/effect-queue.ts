import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:effect-queue",
    name: "Effect Queue",
    description: "Filter to a Effect Queue",
    events: [
        { eventSourceId: "firebot", eventId: "effect-queue-added" },
        { eventSourceId: "firebot", eventId: "effect-queue-cleared" },
        { eventSourceId: "firebot", eventId: "effect-queue-status" }
    ],
    eventMetaKey: "effectQueueId",
    allowIsNot: true,
    presetValues: async (effectQueuesService: any) => {
        return effectQueuesService.getEffectQueues().map(c => ({ value: c.id, display: c.name }));
    },
    valueIsStillValid: async (filterSettings, effectQueuesService: any) => {
        return effectQueuesService.getEffectQueues().some(c => c.id === filterSettings.value);
    }
});

export default filter;