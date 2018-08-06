"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const EventEmitter = require("events");
const util = require("../utility");

class EventManager extends EventEmitter {
  constructor() {
    super();

    this._registeredEventSources = [];
  }

  registerEventSource(eventSource) {
    // TODO: validate eventSource

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
    let eventArrays = this._registeredEventSources.map(es => es.events);
    return util.flattenArray(eventArrays);
  }

  triggerEvent(sourceId, eventId, meta) {
    let event = this.getEventById(sourceId, eventId);
    //todo: support filter checking
    //call event router?
  }
}

const manager = new EventManager();

ipcMain.on("getAllEventSources", event => {
  logger.info("got 'get all event sources' request");
  event.returnValue = manager.getAllEventSources();
});

module.exports = manager;
