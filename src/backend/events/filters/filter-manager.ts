import EventEmitter from "events";

import { EventData, EventFilter, EventFilterData, EventSourceAndId } from "../../../types/events";

import frontendCommunicator from "../../common/frontend-communicator";
import logger from "../../logwrapper";

class FilterManager extends EventEmitter {
    private _registeredFilters: EventFilter[] = [];
    private _additionalFilterEvents: Record<string, EventSourceAndId[]> = {};

    constructor() {
        super();

        frontendCommunicator.on("getFiltersForEvent", (data: EventSourceAndId) => {
            logger.info("got 'get all filters' request");
            const { eventSourceId, eventId } = data;
            return this.getFiltersForEvent(eventSourceId, eventId).map((f) => {
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
    }

    registerFilter(filter: EventFilter): void {
        const idConflict = this._registeredFilters.some(
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

        this._registeredFilters.push(filter);

        logger.debug(`Registered Event Filter ${filter.id}`);

        this.emit("filterRegistered", filter);
    }

    unregisterFilter(id: string): void {
        const existing = this._registeredFilters.some(
            f => f.id === id
        );

        if (!existing) {
            logger.warn(`Could not unregister event filter '${id}'. Filter does not exist.`);
            return;
        }

        this._registeredFilters = this._registeredFilters.filter(f => f.id !== id);

        logger.debug(`Unregistered Event Filter ${id}`);

        this.emit("FilterUnregistered", id);
    }

    addEventToFilter(filterId: string, eventSourceId: string, eventId: string): void {
        if (this.getFiltersForEvent(eventSourceId, eventId).some(f => f.id === filterId)) {
            logger.warn(`Filter ${filterId} already setup for event ${eventSourceId}:${eventId}`);
            return;
        }

        const additionalEvents = this._additionalFilterEvents[filterId] ?? [];

        additionalEvents.push({ eventSourceId, eventId });

        this._additionalFilterEvents[filterId] = additionalEvents;

        logger.debug(`Added event ${eventSourceId}:${eventId} to filter ${filterId}`);
    }

    removeEventFromFilter(filterId: string, eventSourceId: string, eventId: string): void {
        let additionalEvents = this._additionalFilterEvents[filterId] ?? [];

        if (!additionalEvents.some(f => f.eventSourceId === eventSourceId && f.eventId === eventId)) {
            logger.warn(`Filter ${filterId} does not have a plugin registration for event ${eventSourceId}:${eventId}`);
            return;
        }

        additionalEvents = additionalEvents.filter(e => e.eventSourceId !== eventSourceId && e.eventId !== eventId);

        this._additionalFilterEvents[filterId] = additionalEvents;

        logger.debug(`Removed event ${eventSourceId}:${eventId} from filter ${filterId}`);
    }

    getFilterById(filterId: string): EventFilter {
        return this._registeredFilters.find(f => f.id === filterId);
    }

    getAllFilters(): EventFilter[] {
        return this._registeredFilters;
    }

    getFiltersForEvent(eventSourceId: string, eventId: string): EventFilter[] {
        const filters = this._registeredFilters
            .filter((f) => {
                if (!f.events || f.events.length === 0) {
                    return true;
                }
                const events = f.events;
                const additionalEvents = this._additionalFilterEvents[f.id] ?? [];
                return [...events, ...additionalEvents].some(e => e.eventSourceId === eventSourceId && e.eventId === eventId);
            });
        return filters;
    }

    async runFilters(filterData: EventFilterData, eventData: EventData) {
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

export { manager as FilterManager };