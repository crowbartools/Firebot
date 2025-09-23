"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const EventEmitter = require("events");

class FilterManager extends EventEmitter {

    #registeredFilters = [];

    /**
     * @type {Record<string, Array<{ eventSourceId: string, eventId: string }>>}
     */
    #additionalFilterEvents = {};

    constructor() {
        super();
    }

    registerFilter(filter) {
        const idConflict = this.#registeredFilters.some(
            f => f.id === filter.id
        );

        if (idConflict) {
            logger.warn(`Could not register event filter '${filter.id}' a filter with this id already exists.`);
            return;
        }

        if (filter.events == null || filter.events.length === 0) {
            logger.warn(`Could not register event filter '${filter.id}' because no events are specified.`);
            return;
        }

        this.#registeredFilters.push(filter);

        logger.debug(`Registered Event Filter ${filter.id}`);

        this.emit("filterRegistered", filter);
    }

    unregisterFilter(id) {
        const existing = this.#registeredFilters.some(
            f => f.id === id
        );

        if (!existing) {
            logger.warn(`Could not unregister event filter '${id}'. Filter does not exist.`);
            return;
        }

        this.#registeredFilters = this.#registeredFilters.filter(f => f.id !== id);

        logger.debug(`Unregistered Event Filter ${id}`);

        this.emit("FilterUnregistered", id);
    }

    addEventToFilter(filterId, eventSourceId, eventId) {
        const additionalEvents = this.#additionalFilterEvents[filterId] ?? [];

        additionalEvents.push({ eventSourceId, eventId });

        this.#additionalFilterEvents[filterId] = additionalEvents;
    }

    getFilterById(filterId) {
        return this.#registeredFilters.find(f => f.id === filterId);
    }

    getAllFilters() {
        return this.#registeredFilters;
    }

    getFiltersForEvent(eventSourceId, eventId) {
        const filters = this.#registeredFilters
            .filter((f) => {
                if (!f.events || f.events.length === 0) {
                    return true;
                }
                const events = f.events;
                const additionalEvents = this.#additionalFilterEvents[f.id] ?? [];
                return [...events, ...additionalEvents].some(e => e.eventSourceId === eventSourceId && e.eventId === eventId);
            });
        return filters;
    }

    async runFilters(filterData, eventData) {
        if (filterData?.filters?.length > 0) {
            const filterSettings = filterData.filters;

            let didPass = filterData.mode !== "inclusive";
            for (const filterSetting of filterSettings) {
                const filter = this.getFilterById(filterSetting.type);
                if (filter) {
                    try {
                        const successful = await filter.predicate(filterSetting, eventData);

                        if (filterData.mode === "inclusive") {
                            if (successful) {
                                didPass = true;
                                break;
                            }
                        } else {
                            if (!successful) {
                                didPass = false;
                                break;
                            }
                        }
                    } catch (err) {
                        // Tell front end an error happened
                        logger.warn(`An error happened when attempting to process the filter ${filterSetting.type} for event ${eventData.eventSourceId}:${eventData.eventId}: "${err}"`);
                    }
                }
            }

            return didPass;
        }
        return true;
    }
}

const manager = new FilterManager();

ipcMain.on("getFiltersForEvent", (event, data) => {
    logger.info("got 'get all filters' request");
    const { eventSourceId, eventId } = data;
    event.returnValue = manager.getFiltersForEvent(eventSourceId, eventId).map((f) => {
        return {
            id: f.id,
            name: f.name,
            description: f.description,
            comparisonTypes: f.comparisonTypes,
            valueType: f.valueType,
            getPresetValues: f.presetValues ? f.presetValues.toString() : "() => {}",
            getSelectedValueDisplay: f.getSelectedValueDisplay ? f.getSelectedValueDisplay.toString() : "filterSettings => filterSettings.value",
            valueIsStillValid: f.valueIsStillValid ? f.valueIsStillValid.toString() : "() => true"
        };
    });
});

module.exports = manager;
