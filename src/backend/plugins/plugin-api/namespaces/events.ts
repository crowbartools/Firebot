import type {
    PluginEventHandler,
    PluginEventsApi
} from "../../../../types/plugin-api";
import type { TriggeredEvent } from "../../../../types/events";
import { definePluginApiNamespace } from "../internal/define-namespace";

import { EventManager } from "../../../events/event-manager";


export const createEventsApi = definePluginApiNamespace<PluginEventsApi>((ctx) => {
    const handlers = new Set<PluginEventHandler>();

    const onEventTriggered = (event: TriggeredEvent) => {
        if (handlers.size === 0) {
            return;
        }
        for (const handler of handlers) {
            try {
                handler(event);
            } catch (error) {
                ctx.logger.warn("event handler threw", error);
            }
        }
    };

    EventManager.on("event-triggered", onEventTriggered);
    ctx.onDispose(() => {
        EventManager.off("event-triggered", onEventTriggered);
        handlers.clear();
    });

    return {
        onTriggered(handler) {
            handlers.add(handler);
            return () => handlers.delete(handler);
        },

        trigger(sourceId, eventId, meta) {
            return EventManager.triggerEvent(sourceId, eventId, meta ?? null);
        }
    };
});
