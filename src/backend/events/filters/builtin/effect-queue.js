"use strict";

module.exports = {
    id: "firebot:effect-queue",
    name: "Effect Queue",
    description: "Filter to a Effect Queue",
    events: [
        { eventSourceId: "firebot", eventId: "effect-queue-added" },
        { eventSourceId: "firebot", eventId: "effect-queue-cleared" },
        { eventSourceId: "firebot", eventId: "effect-queue-status" }
    ],
    comparisonTypes: ["is", "is not"],
    valueType: "preset",
    presetValues: (effectQueuesService) => {
        return effectQueuesService.getEffectQueues().map((c) => ({ value: c.id, display: c.name }));
    },
    valueIsStillValid: (filterSettings, effectQueuesService) => {
        return new Promise((resolve) => {
            resolve(effectQueuesService.getEffectQueues().some((c) => c.id === filterSettings.value));
        });
    },
    getSelectedValueDisplay: (filterSettings, effectQueuesService) => {
        return new Promise((resolve) => {
            resolve(
                effectQueuesService.getEffectQueues().find((c) => c.id === filterSettings.value)?.name ??
                    "Unknown Effect Queue"
            );
        });
    },
    predicate: (filterSettings, eventData) => {
        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const actual = eventMeta.effectQueueId;
        const expected = value;

        switch (comparisonType) {
            case "is":
                return actual === expected;
            case "is not":
                return actual !== expected;
            default:
                return false;
        }
    }
};
