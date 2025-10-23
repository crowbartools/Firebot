import type { Trigger } from "../../types/triggers";

/**
 * Gets the full event ID from the associated trigger
 *
 * @param trigger The trigger to check
 * @returns A string with the full event ID, or `undefined` if it wasn't triggered by an event
 */
export const getEventIdFromTriggerData = (trigger: Trigger): string => {
    const { eventSource, event } = trigger.metadata;

    if (eventSource && event) {
        return `${eventSource.id}:${event.id}`;
    }

    return undefined;
};