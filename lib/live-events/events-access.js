"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");
const fs = require("fs");
const path = require("path");
const settings = require("../common/settings-access").settings;

const EVENTS_FOLDER = "/events/";

let mainEvents = {};
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
        logger.warn(`There was an error reading events data file.`);
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

ipcMain.on("getAllEventData", event => {
    logger.debug("got 'get all event data' request");
    event.returnValue = {
        mainEvents: Object.values(mainEvents),
        activeGroup,
        groups: Object.values(groups)
    };
});

ipcMain.on("eventUpdate", (_, data) => {
    logger.debug("got 'eventUpdate' event");

    const { action, meta } = data;

    switch (action) {
    case "setActiveGroup":
        setActiveGroup(meta.groupId);
    }

});

exports.loadEventsAndGroups = loadEventsAndGroups;