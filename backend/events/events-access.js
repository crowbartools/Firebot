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
    return profileManager.getJsonDbInProfile(EVENTS_FOLDER + "events");
}

function saveGroup(group) {
    if (group == null) return;
    let eventsDb = getEventsDb();
    try {
        groups[group.id] = group;
        eventsDb.push("/groups/" + group.id, group);
        logger.debug(`Saved event group '${group.id}'.`);
    } catch (err) {
        logger.warn(`Unable to save event group '${group.id}'.`, err);
    }
}

function saveSortTags() {
    let eventsDb = getEventsDb();
    try {
        eventsDb.push("/sortTags", sortTags);
        logger.debug(`Saved event sort tags.`);
    } catch (err) {
        logger.warn(`Unable to save event sort tags.`, err);
    }
}

function loadEventsAndGroups() {
    logger.debug(`Attempting to load event data...`);

    let eventsDb = getEventsDb();

    try {
        let eventsData = eventsDb.getData("/");

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
    if (groupId == null) return;
    let eventsDb = getEventsDb();
    try {
        eventsDb.delete("/groups/" + groupId);
        delete groups[groupId];
        logger.debug(`Deleted event group '${groupId}'.`);
    } catch (err) {
        logger.warn(`Unable to delete event group '${groupId}'.`, err);
    }
}

function saveMainEvents(events) {
    if (events == null) return;
    let eventsDb = getEventsDb();
    try {
        mainEvents = events;
        eventsDb.push("/mainEvents", events);
        logger.debug(`Saved main events.`);
    } catch (err) {
        logger.warn(`Unable to save main events.`, err);
    }
}

function saveNewEventToMainEvents(event) {
    if (event == null) return;
    let eventsDb = getEventsDb();
    try {
        if (mainEvents == null) {
            mainEvents = [];
        }
        mainEvents.push(event);
        eventsDb.push("/mainEvents[]", event, true);
        logger.debug(`Saved main events.`);
    } catch (err) {
        logger.warn(`Unable to save new event to main events.`, err);
    }
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

function updateEventGroupActiveStatus(groupId, active = false) {
    const group = groups[groupId];

    if (group == null) return;

    group.active = active;

    saveGroup(group);

    frontendCommunicator.send("event-group-update", group);
}

exports.triggerUiRefresh = () => {
    frontendCommunicator.send("main-events-update");
};


exports.saveNewEventToMainEvents = saveNewEventToMainEvents;
exports.loadEventsAndGroups = loadEventsAndGroups;
exports.getAllActiveEvents = getAllActiveEvents;
exports.updateEventGroupActiveStatus = updateEventGroupActiveStatus;