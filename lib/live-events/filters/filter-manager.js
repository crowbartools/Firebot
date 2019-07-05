"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const EventEmitter = require("events");

class FilterManager extends EventEmitter {
    constructor() {
        super();

        this._registeredFilters = [];
    }

    registerFilter(filter) {
        let idConflict = this._registeredFilters.some(
            f => f.id === filter.id
        );

        if (idConflict) {
            logger.warning(`Could not register event filter '${filter.id}' a filter with this id already exists.`);
            return;
        }

        if (filter.events == null || filter.events.length === 0) {
            logger.warning(`Could not register event filter '${filter.id}' because no events are specified.`);
            return;
        }

        // TODO: validate the filter better

        this._registeredFilters.push(filter);

        logger.debug(`Registered Event Filter ${filter.id}`);

        this.emit("filterRegistered", filter);
    }

    getFilterById(filterId) {
        return this._registeredFilters.find(f => f.id === filterId);
    }

    getAllFilters() {
        return this._registeredFilters;
    }

    getFiltersForEvent(eventSourceId, eventId) {
        let filters = this._registeredFilters
            .filter(f => f.events
                .some(e => e.eventSourceId === eventSourceId && e.eventId === eventId));
        return filters;
    }

    runFilters(filterSettings, eventData) {
        if (filterSettings != null) {
            for (let filterSetting of filterSettings) {
                const filter = this.getFilterById(filterSetting.id);
                if (filter) {
                    let passed = filter.predicate(filterSetting, eventData);
                    if (!passed) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}

const manager = new FilterManager();

ipcMain.on("getFiltersForEvent", (event, data) => {
    logger.info("got 'get all filters' request");
    let { eventSourceId, eventId } = data;
    event.returnValue = manager.getFiltersForEvent(eventSourceId, eventId).map(f => {
        return {
            id: f.id,
            name: f.name,
            description: f.description,
            comparisonTypes: f.comparisonTypes,
            valueType: f.valueType
        };
    });
});

module.exports = manager;
