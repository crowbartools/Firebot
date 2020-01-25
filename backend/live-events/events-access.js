"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");

const frontendCommunicator = require("../common/frontend-communicator");

const EVENTS_FOLDER = "/events/";

let mainEvents = [];
let activeGroup = null;
let groups = {};

function getEventsDb() {
    return profileManager.getJsonDbInProfile(EVENTS_FOLDER + "events");
}

function loadEventsAndGroups() {
    logger.debug(`Attempting to load event data...`);

    let eventsDb = getEventsDb();

    try {
        let eventsData = eventsDb.getData("/");

        if (eventsData.mainEvents) {
            mainEvents = eventsData.mainEvents;
        }

        if (eventsData.activeGroup) {
            activeGroup = eventsData.activeGroup;
        }

        if (eventsData.groups) {
            groups = eventsData.groups;
        }

        logger.debug(`Loaded event data.`);
    } catch (err) {
        logger.warn(`There was an error reading events data file.`, err);
    }
}

function setActiveGroup(groupId) {
    activeGroup = groupId;
    let eventsDb = getEventsDb();
    try {
        eventsDb.push("/activeGroup", groupId);
        logger.debug(`Saved active event group '${groupId}'.`);
    } catch (err) {
        logger.warn(`Unable to save active event group '${groupId}'.`, err);
    }
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

function deleteGroup(groupId) {
    if (groupId == null) return;
    let eventsDb = getEventsDb();
    try {
        eventsDb.delete("/groups/" + groupId);
        delete groups[groupId];
        if (activeGroup === groupId) {
            setActiveGroup(null);
        }
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

function getActiveGroup() {
    let active = groups[activeGroup];
    return active ? active : {};
}

function getAllActiveEvents() {
    let mainEventsArray = Array.isArray(mainEvents) ? mainEvents : Object.values(mainEvents);
    let activeEventsArray = [];
    let activeGroup = getActiveGroup();
    if (activeGroup && activeGroup.events) {
        activeEventsArray = Object.values(activeGroup.events);
    }

    return mainEventsArray.concat(activeEventsArray).filter(e => e.active);
}

ipcMain.on("getAllEventData", event => {
    logger.debug("got 'get all event data' request");
    event.returnValue = {
        mainEvents: Array.isArray(mainEvents) ? mainEvents : Object.values(mainEvents),
        activeGroup,
        groups: Object.values(groups)
    };
});

ipcMain.on("eventUpdate", (_, data) => {
    logger.debug("got 'eventUpdate' event");

    const { action, meta } = data;

    switch (action) {
    case "setActiveGroup":
        setActiveGroup(meta);
        break;
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

exports.triggerUiRefresh = () => {
    frontendCommunicator.send("main-events-update");
};


exports.saveNewEventToMainEvents = saveNewEventToMainEvents;
exports.loadEventsAndGroups = loadEventsAndGroups;
exports.getAllActiveEvents = getAllActiveEvents;