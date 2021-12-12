"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const EventEmitter = require("events");
const util = require("../utility");
const eventsRouter = require("./events-router");
const eventsAccess = require("./events-access");
const frontendCommunicator = require("../common/frontend-communicator");
const accountAccess = require("../common/account-access");

/**@extends NodeJS.EventEmitter */
class EventManager extends EventEmitter {
    constructor() {
        super();

        this._registeredEventSources = [];
    }

    registerEventSource(eventSource) {
        // TODO: validate eventSource

        let idConflict = this._registeredEventSources.some(
            es => es.id === eventSource.id
        );

        if (idConflict) {
            return;
        }

        //make sure all events reference this eventsource id
        if (eventSource.events != null) {
            for (let event of eventSource.events) {
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
        let source = this._registeredEventSources.find(es => es.id === sourceId);
        let event = source.events.find(e => e.id === eventId);
        return event;
    }

    getAllEventSources() {
        return this._registeredEventSources;
    }

    getAllEvents() {
        let eventArrays = this._registeredEventSources
            .map(es => es.events);
        let events = util.flattenArray(eventArrays);

        return events;
    }

    triggerEvent(sourceId, eventId, meta, isManual = false, isRetrigger = false, isSimulation = false) {
        let source = this.getEventSourceById(sourceId);
        let event = this.getEventById(sourceId, eventId);
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

        eventsRouter.onEventTriggered(event, source, meta, isManual, isRetrigger, isSimulation);

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

    let { sourceId, eventId, eventSettingsId } = data;

    let source = manager.getEventSourceById(sourceId);
    let event = manager.getEventById(sourceId, eventId);
    if (event == null) {
        return;
    }

    let meta = event.manualMetadata || {};
    if (meta.username == null) {
        const accountAccess = require("../common/account-access");
        meta.username = accountAccess.getAccounts().streamer.username;
    }

    let eventSettings = eventsAccess.getAllActiveEvents().find(e => e.id === eventSettingsId);
    if (eventSettings == null) {
        return;
    }

    eventsRouter.runEventEffects(eventSettings.effects, event, source, meta, true);
});

frontendCommunicator.on("simulateEvent", (eventData) => {
    if (Object.keys(eventData.metadata).length > 0) {
        manager.triggerEvent(eventData.sourceId, eventData.eventId, eventData.metadata, true, false, true);
    } else {
        manager.triggerEvent(eventData.sourceId, eventData.eventId, null, true, false, true);
    }
});

frontendCommunicator.onAsync("getEventSource", async (event) => {
    const allEventSources = JSON.parse(JSON.stringify(manager.getAllEventSources()));
    const filteredSource = allEventSources.find(es => es.id === event.sourceId);

    return filteredSource.events.find(s => s.id === event.eventId);
});

module.exports = manager;
