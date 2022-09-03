import { EventSource } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-manager";

declare class EventManager {
  registerEventSource(eventSource: EventSource): void;
  triggerEvent(
    sourceId: string,
    eventId: string,
    meta: Record<string, unknown>,
    isManual?: boolean
  ): void;
}

declare const _EventManager: EventManager;
export default _EventManager;
