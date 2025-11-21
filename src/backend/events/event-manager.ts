import { TypedEmitter } from "tiny-typed-emitter";

import type {
    EventManagerModule,
    EventDefinition,
    EventSource
} from "../../types";

import { AccountAccess } from "../common/account-access";
import { EventsAccess } from "./events-access";
import eventsRouter from "./events-router";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";
import { flattenArray, simpleClone } from "../utils";

type RegisteredEventDefinition = EventDefinition & {
    sourceId?: string;
};

type RegisteredEventSource = Omit<EventSource, "events"> & {
    events: RegisteredEventDefinition[];
};

class EventManager extends TypedEmitter<{
    "eventSourceRegistered": (source: RegisteredEventSource) => void;
    "eventSourceUnregistered": (id: string) => void;
    "event-triggered": (event: {
        event: EventDefinition;
        source: EventSource;
        meta: Record<string, unknown>;
        isManual: boolean;
        isRetrigger: boolean;
    }) => void;
}> implements EventManagerModule {
    private _registeredEventSources: RegisteredEventSource[] = [];

    constructor() {
        super();

        frontendCommunicator.on("events:get-all-event-sources", () => {
            logger.info("got 'get all event sources' request");
            return simpleClone(this.getAllEventSources());
        });

        frontendCommunicator.on("events:get-all-events", () => {
            logger.info("got 'get all events' request");
            return simpleClone(this.getAllEvents());
        });

        frontendCommunicator.on("events:trigger-manual-event", (data: {
            sourceId: string;
            eventId: string;
            eventSettingsId: string;
        }) => {
            const { sourceId, eventId, eventSettingsId } = data;

            const source = this.getEventSourceById(sourceId);
            const event = this.getEventById(sourceId, eventId);
            if (event == null) {
                return;
            }

            const meta = structuredClone(event.manualMetadata ?? {});
            for (const [key, value] of Object.entries(meta) as [string, Record<string, unknown>][]) {
                if (typeof value !== 'object' || value == null || Array.isArray(value) || value.type == null || value.value == null) {
                    continue;
                }
                meta[key] = value.value;
            }
            if (meta.username == null) {
                meta.username = AccountAccess.getAccounts().streamer.username;
            }

            const eventSettings = EventsAccess.getAllActiveEvents().find(e => e.id === eventSettingsId);
            if (eventSettings == null) {
                return;
            }

            void eventsRouter.runEventEffects(eventSettings.effects, event, source, meta, true);
        });

        frontendCommunicator.on("events:simulate-event", (eventData: {
            sourceId: string;
            eventSourceId: string;
            eventId: string;
            metadata: Record<string, unknown>;
        }) => {
            if (Object.keys(eventData.metadata).length > 0) {
                void this.triggerEvent(eventData.sourceId, eventData.eventId, eventData.metadata, true, false, true);
            } else {
                void this.triggerEvent(eventData.sourceId, eventData.eventId, null, true, false, true);
            }
        });

        frontendCommunicator.on("events:get-event-source", (event: {
            sourceId: string;
            eventId: string;
        }) => {
            const allEventSources = simpleClone(this.getAllEventSources());
            const filteredSource = allEventSources.find(es => es.id === event.sourceId);

            return filteredSource.events.find(s => s.id === event.eventId);
        });
    }

    registerEventSource(eventSource: RegisteredEventSource): void {
        const idConflict = this._registeredEventSources.some(
            es => es.id === eventSource.id
        );

        if (idConflict) {
            return;
        }

        if (eventSource.events != null) {
            for (const event of eventSource.events) {
                event.sourceId = eventSource.id;
            }
        }

        this._registeredEventSources.push(eventSource);

        logger.debug(`Registered Event Source ${eventSource.id}`);

        this.emit("eventSourceRegistered", eventSource);
    }

    unregisterEventSource(id: string): void {
        const existing = this._registeredEventSources.some(
            es => es.id === id
        );

        if (!existing) {
            logger.debug(`Cannot unregister event source ${id}. Event source does not exist.`);
            return;
        }

        this._registeredEventSources = this._registeredEventSources.filter(s => s.id !== id);

        this.emit("eventSourceUnregistered", id);
    }

    getEventSourceById(sourceId: string): RegisteredEventSource {
        return this._registeredEventSources.find(es => es.id === sourceId);
    }

    getEventById(sourceId: string, eventId: string): EventDefinition {
        const source = this._registeredEventSources.find(es => es.id === sourceId);
        const event = source.events.find(e => e.id === eventId);
        return event;
    }

    getAllEventSources(): RegisteredEventSource[] {
        return this._registeredEventSources;
    }

    getAllEvents(): EventDefinition[] {
        const eventArrays = this._registeredEventSources
            .map(es => es.events);
        const events = flattenArray(eventArrays);

        return events;
    }

    async triggerEvent(
        eventSourceId: string,
        eventId: string,
        meta: Record<string, unknown>,
        isManual = false,
        isRetrigger = false,
        isSimulation = false
    ): Promise<void> {
        const source = this.getEventSourceById(eventSourceId);
        const event = this.getEventById(eventSourceId, eventId);
        if (event == null) {
            return;
        }

        if (isManual && !isSimulation) {
            meta = event.manualMetadata || {};
        }
        if (meta == null) {
            meta = {};
        }

        if (meta.username == null) {
            meta.username = AccountAccess.getAccounts().streamer.username;
        }

        const eventTriggeredPromise = eventsRouter.onEventTriggered(event, source, meta, isManual, isRetrigger, isSimulation);

        if (!isManual && !isRetrigger) {
            if (!eventsRouter.cacheActivityFeedEvent(source, event, meta)) {
                this.emit("event-triggered", {
                    event,
                    source,
                    meta,
                    isManual,
                    isRetrigger
                });
            }
        }

        return eventTriggeredPromise;
    }
}

const manager = new EventManager();

export { manager as EventManager };