"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const EventEmitter = require("events");
const util = require("../utility");
const eventsRouter = require("./events-router");
const eventsAccess = require("./events-access");
const frontendCommunicator = require("../common/frontend-communicator");

/**@extends NodeJS.EventEmitter */
class EventManager extends EventEmitter {
    constructor() {
        super();

        this._registeredEventSources = [];
    }

    registerEventSource(eventSource) {
        // TODO: validate eventSource

        const idConflict = this._registeredEventSources.some(
            es => es.id === eventSource.id
        );

        if (idConflict) {
            return;
        }

        //make sure all events reference this eventsource id
        if (eventSource.events != null) {
            for (const event of eventSource.events) {
                event.sourceId = eventSource.id;
            }
        }

        this._registeredEventSources.push(eventSource);

        logger.debug(`Registered Event Source ${eventSource.id}`);

        this.emit("eventSourceRegistered", eventSource);
    }

    getEventSourceById(sourceId) {
        return this._registeredEventSources.find(es => es.id === sourceId);
    }

    getEventById(sourceId, eventId) {
        const source = this._registeredEventSources.find(es => es.id === sourceId);
        const event = source.events.find(e => e.id === eventId);
        return event;
    }

    getAllEventSources() {
        return this._registeredEventSources;
    }

    getAllEvents() {
        const eventArrays = this._registeredEventSources
            .map(es => es.events);
        const events = util.flattenArray(eventArrays);

        return events;
    }

    async triggerEvent(sourceId, eventId, meta, isManual = false, isRetrigger = false, isSimulation = false) {
        const source = this.getEventSourceById(sourceId);
        const event = this.getEventById(sourceId, eventId);
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
            const accountAccess = require("../common/account-access");
            meta.username = accountAccess.getAccounts().streamer.username;
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

ipcMain.on("getAllEventSources", (event) => {
    logger.info("got 'get all event sources' request");
    event.returnValue = JSON.parse(JSON.stringify(manager.getAllEventSources()));
});

ipcMain.on("getAllEvents", (event) => {
    logger.info("got 'get all events' request");
    event.returnValue = JSON.parse(JSON.stringify(manager.getAllEvents()));
});

// Manually Activate an Event for Testing
// This will manually trigger an event for testing purposes.
ipcMain.on("triggerManualEvent", function(_, data) {

    const { sourceId, eventId, eventSettingsId } = data;

    const source = manager.getEventSourceById(sourceId);
    const event = manager.getEventById(sourceId, eventId);
    if (event == null) {
        return;
    }

    const meta = structuredClone(event.manualMetadata || {});
    for (const [key, value] of Object.entries(meta)) {
        if (typeof value !== 'object' || value == null || Array.isArray(value) || value.type == null || value.value == null) {
            continue;
        }
        meta[key] = value.value;
    }
    if (meta.username == null) {
        const accountAccess = require("../common/account-access");
        meta.username = accountAccess.getAccounts().streamer.username;
    }

    const eventSettings = eventsAccess.getAllActiveEvents().find(e => e.id === eventSettingsId);
    if (eventSettings == null) {
        return;
    }

    eventsRouter.runEventEffects(eventSettings.effects, event, source, meta, true);
});

frontendCommunicator.on("simulateEvent", (eventData) => {
    if (Object.keys(eventData.metadata).length > 0) {
        manager.triggerEvent(eventData.sourceId, eventData.eventId, eventData.metadata, true, eventData.forceRetrigger, true);
    } else {
        manager.triggerEvent(eventData.sourceId, eventData.eventId, null, true, eventData.forceRetrigger, true);
    }
});

frontendCommunicator.onAsync("getEventSource", async (event) => {
    const allEventSources = JSON.parse(JSON.stringify(manager.getAllEventSources()));
    const filteredSource = allEventSources.find(es => es.id === event.sourceId);

    return filteredSource.events.find(s => s.id === event.eventId);
});

module.exports = manager;
