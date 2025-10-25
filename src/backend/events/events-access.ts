import { join } from "path";

import type { EventGroup, EventSettings } from "../../types/events";
import type { SortTag } from "../../types/sort-tags";

import { ProfileManager } from "../common/profile-manager";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

const EVENTS_FOLDER = "events";

interface EventData {
    mainEvents: EventSettings[];
    groups: Record<string, EventGroup>;
    activeGroup: string;
    sortTags: SortTag[];
}

class EventsAccess {
    private _mainEvents: EventSettings[] = [];
    private _groups: Record<string, EventGroup> = {};
    private _sortTags: SortTag[] = [];

    constructor() {
        frontendCommunicator.on("getAllEventData", () => {
            logger.debug("got 'get all event data' request");
            return {
                mainEvents: Array.isArray(this._mainEvents)
                    ? this._mainEvents
                    : Object.values(this._mainEvents),
                groups: Object.values(this._groups),
                sortTags: this._sortTags
            };
        });

        frontendCommunicator.on("eventUpdate", (data: {
            action: string;
            meta: unknown;
        }) => {
            logger.debug("got 'eventUpdate' event");

            const { action, meta } = data;

            switch (action) {
                //case "setActiveGroup":
                //setActiveGroup(meta);
                //break;
                case "saveGroup":
                    this.saveGroup(meta as EventGroup);
                    break;
                case "deleteGroup":
                    this.deleteGroup(meta as string);
                    break;
                case "saveMainEvents":
                    this.saveMainEvents(meta as EventSettings[]);
                    break;
            }
        });

        frontendCommunicator.on("event-sort-tags-update", (tags: SortTag[]) => {
            this._sortTags = tags;
            this.saveSortTags();
        });
    }

    private getEventsDb() {
        return ProfileManager.getJsonDbInProfile(join(EVENTS_FOLDER, "events"));
    }

    private saveMainEvents(events: EventSettings[]) {
        if (events == null) {
            return;
        }
        const eventsDb = this.getEventsDb();
        try {
            this._mainEvents = events;
            eventsDb.push("/mainEvents", events);
            logger.debug(`Saved main events.`);
        } catch (err) {
            logger.warn(`Unable to save main events.`, err);
        }
    }

    private saveGroup(group: EventGroup): void {
        if (group == null) {
            return;
        }
        const eventsDb = this.getEventsDb();
        try {
            this._groups[group.id] = group;
            eventsDb.push(`/groups/${group.id}`, group);
            logger.debug(`Saved event group '${group.id}'.`);
        } catch (err) {
            logger.warn(`Unable to save event group '${group.id}'.`, err);
        }
    }

    private saveAllGroups(groupsToSave: Record<string, EventGroup>): void {
        if (groupsToSave == null) {
            return;
        }
        const eventsDb = this.getEventsDb();
        try {
            this._groups = groupsToSave;
            eventsDb.push("/groups", groupsToSave);
            logger.debug(`Saved all groups.`);
        } catch (err) {
            logger.warn(`Unable to save groups.`, err);
        }
    }

    removeEventFromGroups(eventId: string): void {
        for (const group in this._groups) {
            if (this._groups.hasOwnProperty(group)) {
                const events = this._groups[group].events;

                this._groups[group].events = events.filter(e => e.id !== eventId);
            }
        }

        this.saveAllGroups(this._groups);
    }

    saveSortTags(): void {
        const eventsDb = this.getEventsDb();
        try {
            eventsDb.push("/sortTags", this._sortTags);
            logger.debug(`Saved event tags.`);
        } catch (err) {
            logger.warn(`Unable to save event tags.`, err);
        }
    }

    loadEventsAndGroups() {
        logger.debug(`Attempting to load event data...`);

        const eventsDb = this.getEventsDb();

        try {
            const eventsData = eventsDb.getData("/") as EventData;

            if (eventsData.mainEvents) {
                this._mainEvents = eventsData.mainEvents;
            }

            if (eventsData.groups) {
                this._groups = eventsData.groups;
            }

            // convert old active group data to new
            // changed in v5.14.0
            if (eventsData.activeGroup) {
                const activeGroup = this._groups[eventsData.activeGroup];
                if (activeGroup) {
                    activeGroup.active = true;
                    this.saveGroup(activeGroup);
                }
                eventsDb.delete("/activeGroup");
            }

            if (eventsData.sortTags) {
                this._sortTags = eventsData.sortTags;
            }

            logger.debug(`Loaded event data.`);
        } catch (err) {
            logger.warn(`There was an error reading events data file.`, err);
        }
    }

    deleteGroup(groupId: string): void {
        if (groupId == null) {
            return;
        }
        const eventsDb = this.getEventsDb();
        try {
            eventsDb.delete(`/groups/${groupId}`);
            delete this._groups[groupId];
            logger.debug(`Deleted event group '${groupId}'.`);
        } catch (err) {
            logger.warn(`Unable to delete event group '${groupId}'.`, err);
        }
    }

    saveNewEventToMainEvents(event: EventSettings) {
        if (event == null || event.id == null) {
            return;
        }
        try {
            if (this._mainEvents == null) {
                this._mainEvents = [];
            }

            // remove existing event if present
            this._mainEvents = this._mainEvents.filter(e => e.id !== event.id);

            this._mainEvents.push(event);

            this.saveMainEvents(this._mainEvents);
        } catch (err) {
            logger.warn(`Unable to save new event to main events.`, err);
        }
    }

    removeEventFromMainEvents(eventId: string) {
        this._mainEvents = this._mainEvents.filter(e => e.id !== eventId);
        this.saveMainEvents(this._mainEvents);
    }

    saveGroupFromImport(group: EventGroup) {
        if (group == null) {
            return;
        }

        // IF present, remove existing events with the same id.
        for (const event of group.events) {
            this.removeEventFromMainEvents(event.id);
            this.removeEventFromGroups(event.id);
        }

        this.saveGroup(group);
    }

    getAllActiveEvents(): EventSettings[] {
        let activeEventsArray: EventSettings[] = Array.isArray(this._mainEvents)
            ? this._mainEvents
            : Object.values(this._mainEvents);

        const activeGroups = Object.values(this._groups).filter(g => g.active);
        for (const group of activeGroups) {
            if (group.events != null && Array.isArray(group.events) && group.events.length > 0) {
                activeEventsArray = activeEventsArray.concat(group.events);
            }
        }

        return activeEventsArray.filter(e => e.active);
    }

    getEvent(eventId: string) {
        let event = this._mainEvents.find(e => e.id === eventId);

        if (event == null) {
            for (const groupId of Object.keys(this._groups)) {
                event = this._groups[groupId].events.find(e => e.id === eventId);
            }
        }

        return event;
    }

    updateEventActiveStatus(eventId: string, active = false) {
        let event = this._mainEvents.find(e => e.id === eventId);

        if (event != null) {
            event.active = active;

            const index = this._mainEvents.findIndex(e => e.id === event.id);
            this._mainEvents[index] = event;

            this.saveMainEvents(this._mainEvents);
            frontendCommunicator.send("main-events-update");
        } else {
            for (const [groupId, group] of Object.entries(this._groups)) {
                event = this._groups[groupId].events.find(e => e.id === eventId);

                if (event) {
                    event.active = active;

                    const index = this._groups[groupId].events.findIndex(e => e.id === event.id);
                    group.events[index] = event;

                    this.saveGroup(group);
                    frontendCommunicator.send("event-group-update", group);
                }
            }
            return;
        }
    }

    updateEventGroupActiveStatus(groupId: string, active = false) {
        const group = this._groups[groupId];

        if (group == null) {
            return;
        }

        group.active = active;

        this.saveGroup(group);

        frontendCommunicator.send("event-group-update", group);
    }

    triggerUiRefresh() {
        frontendCommunicator.send("main-events-update");
    }
}

const eventsAccess = new EventsAccess();

export { eventsAccess as EventsAccess };