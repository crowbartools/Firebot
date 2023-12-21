"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");

const frontendCommunicator = require("../common/frontend-communicator");

const EVENTS_FOLDER = "/events/";

let mainEvents = [];
let groups = {};
let sortTags = [];

function getEventsDb() {
    return profileManager.getJsonDbInProfile(`${EVENTS_FOLDER}events`);
}

function saveGroup(group) {
    if (group == null) {
        return;
    }
    const eventsDb = getEventsDb();
    try {
        groups[group.id] = group;
        eventsDb.push(`/groups/${group.id}`, group);
        logger.debug(`Saved event group '${group.id}'.`);
    } catch (err) {
        logger.warn(`Unable to save event group '${group.id}'.`, err);
    }
}

function saveAllGroups(groupsToSave) {
    if (groupsToSave == null) {
        return;
    }
    const eventsDb = getEventsDb();
    try {
        groups = groupsToSave;
        eventsDb.push("/groups", groupsToSave);
        logger.debug(`Saved all groups.`);
    } catch (err) {
        logger.warn(`Unable to save groups.`, err);
    }
}

function removeEventFromGroups(eventId) {
    for (const group in groups) {
        if (groups.hasOwnProperty(group)) {
            const events = groups[group].events;

            groups[group].events = events.filter(e => e.id !== eventId);
        }
    }

    saveAllGroups(groups);
}

function saveSortTags() {
    const eventsDb = getEventsDb();
    try {
        eventsDb.push("/sortTags", sortTags);
        logger.debug(`Saved event tags.`);
    } catch (err) {
        logger.warn(`Unable to save event tags.`, err);
    }
}

function loadEventsAndGroups() {
    logger.debug(`Attempting to load event data...`);

    const eventsDb = getEventsDb();

    try {
        const eventsData = eventsDb.getData("/");

        if (eventsData.mainEvents) {
            mainEvents = eventsData.mainEvents;
        }

        if (eventsData.groups) {
            groups = eventsData.groups;
        }

        // convert old active group data to new
        // changed in v5.14.0
        if (eventsData.activeGroup) {
            const activeGroup = groups[eventsData.activeGroup];
            if (activeGroup) {
                activeGroup.active = true;
                saveGroup(activeGroup);
            }
            eventsDb.delete("/activeGroup");
        }

        if (eventsData.sortTags) {
            sortTags = eventsData.sortTags;
        }

        logger.debug(`Loaded event data.`);
    } catch (err) {
        logger.warn(`There was an error reading events data file.`, err);
    }
}

function deleteGroup(groupId) {
    if (groupId == null) {
        return;
    }
    const eventsDb = getEventsDb();
    try {
        eventsDb.delete(`/groups/${groupId}`);
        delete groups[groupId];
        logger.debug(`Deleted event group '${groupId}'.`);
    } catch (err) {
        logger.warn(`Unable to delete event group '${groupId}'.`, err);
    }
}

function saveMainEvents(events) {
    if (events == null) {
        return;
    }
    const eventsDb = getEventsDb();
    try {
        mainEvents = events;
        eventsDb.push("/mainEvents", events);
        logger.debug(`Saved main events.`);
    } catch (err) {
        logger.warn(`Unable to save main events.`, err);
    }
}

function saveNewEventToMainEvents(event) {
    if (event == null || event.id == null) {
        return;
    }
    try {
        if (mainEvents == null) {
            mainEvents = [];
        }

        // remove existing event if present
        mainEvents = mainEvents.filter(e => e.id !== event.id);

        mainEvents.push(event);

        saveMainEvents(mainEvents);
    } catch (err) {
        logger.warn(`Unable to save new event to main events.`, err);
    }
}

function removeEventFromMainEvents(eventId) {
    mainEvents = mainEvents.filter(e => e.id !== eventId);
    saveMainEvents(mainEvents);
}

function saveGroupFromImport(group) {
    if (group == null) {
        return;
    }

    // IF present, remove existing events with the same id.
    for (const event of group.events) {
        removeEventFromMainEvents(event.id);
        removeEventFromGroups(event.id);
    }

    saveGroup(group);
}

function getAllActiveEvents() {
    let activeEventsArray = Array.isArray(mainEvents) ? mainEvents : Object.values(mainEvents);

    const activeGroups = Object.values(groups).filter(g => g.active);
    for (const group of activeGroups) {
        if (group.events != null && Array.isArray(group.events) && group.events.length > 0) {
            activeEventsArray = activeEventsArray.concat(group.events);
        }
    }

    return activeEventsArray.filter(e => e.active);
}

function getEvent(eventId) {
    let event = mainEvents.find(e => e.id === eventId);

    if (event == null) {
        for (const groupId of Object.keys(groups)) {
            event = groups[groupId].events.find(e => e.id === eventId);
        }
    }

    return event;
}

ipcMain.on("getAllEventData", event => {
    logger.debug("got 'get all event data' request");
    event.returnValue = {
        mainEvents: Array.isArray(mainEvents) ? mainEvents : Object.values(mainEvents),
        groups: Object.values(groups),
        sortTags: sortTags
    };
});

ipcMain.on("eventUpdate", (_, data) => {
    logger.debug("got 'eventUpdate' event");

    const { action, meta } = data;

    switch (action) {
    //case "setActiveGroup":
    //setActiveGroup(meta);
    //break;
        case "saveGroup":
            saveGroup(meta);
            break;
        case "deleteGroup":
            deleteGroup(meta);
            break;
        case "saveMainEvents":
            saveMainEvents(meta);
            break;
    }
});

frontendCommunicator.on("event-sort-tags-update", tags => {
    sortTags = tags;
    saveSortTags();
});

function updateEventActiveStatus(eventId, active = false) {
    let event = mainEvents.find(e => e.id === eventId);

    if (event != null) {
        event.active = active;

        const index = mainEvents.findIndex(e => e.id === event.id);
        mainEvents[index] = event;

        saveMainEvents(mainEvents);
        frontendCommunicator.send("main-events-update");
    } else {
        for (const [groupId, group] of Object.entries(groups)) {
            event = groups[groupId].events.find(e => e.id === eventId);

            if (event) {
                event.active = active;

                const index = groups[groupId].events.findIndex(e => e.id === event.id);
                group.events[index] = event;

                saveGroup(group);
                frontendCommunicator.send("event-group-update", group);
            }
        }
        return;
    }
}

function updateEventGroupActiveStatus(groupId, active = false) {
    const group = groups[groupId];

    if (group == null) {
        return;
    }

    group.active = active;

    saveGroup(group);

    frontendCommunicator.send("event-group-update", group);
}

exports.triggerUiRefresh = () => {
    frontendCommunicator.send("main-events-update");
};


exports.saveNewEventToMainEvents = saveNewEventToMainEvents;
exports.saveGroupFromImport = saveGroupFromImport;
exports.deleteGroup = deleteGroup;
exports.removeEventFromMainEvents = removeEventFromMainEvents;
exports.loadEventsAndGroups = loadEventsAndGroups;
exports.getAllActiveEvents = getAllActiveEvents;
exports.getEvent = getEvent;
exports.updateEventGroupActiveStatus = updateEventGroupActiveStatus;
exports.updateEventActiveStatus = updateEventActiveStatus;