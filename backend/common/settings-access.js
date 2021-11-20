"use strict";

const profileManager = require("./profile-manager");
const logger = require("../logwrapper");
const frontendCommunicator = require("./frontend-communicator");

// This file centralizes access to the settings db
// We will need to refactor other files to use this.
let settings = {};

let settingsCache = {};

settings.flushSettingsCache = function() {
    settingsCache = {};
    frontendCommunicator.send("flush-settings-cache");
};

frontendCommunicator.on("settings-updated-renderer", (settingsUpdate) => {
    if (settingsUpdate == null) {
        return;
    }
    let { path, data } = settingsUpdate;
    if (path == null || path === '') {
        return;
    }
    settingsCache[path] = data;
});

frontendCommunicator.on("purge-settings-cache", () => {
    settingsCache = {};
});

function getSettingsFile() {
    return profileManager.getJsonDbInProfile("/settings");
}

function pushDataToFile(path, data) {
    try {
        getSettingsFile().push(path, data);
        settingsCache[path] = data;
        frontendCommunicator.send("settings-updated-main", { path, data });
    } catch (err) {
        logger.debug(err.message);
    }
}

function getDataFromFile(path, forceCacheUpdate = false) {
    try {
        if (settingsCache[path] == null || forceCacheUpdate) {
            let data = getSettingsFile().getData(path);
            settingsCache[path] = data;
        }
    } catch (err) {
        if (err.name !== "DataError") {
            logger.warn(err);
        }
    }
    return settingsCache[path];
}

settings.getGuardAgainstUnfollowUnhost = function() {
    let enabled = getDataFromFile('/settings/moderation/guardAgainstUnfollowUnhost');
    return enabled != null ? enabled : false;
};

settings.getEventSettings = function() {
    return getDataFromFile("/settings/eventSettings");
};

settings.isCustomScriptsEnabled = function() {
    return getDataFromFile("/settings/runCustomScripts") === true;
};

settings.setCustomScriptsEnabled = function(enabled) {
    pushDataToFile("/settings/runCustomScripts", enabled === true);
};

settings.ignoreSubsequentSubEventsAfterCommunitySub = function() {
    const ignoreSubEvents = getDataFromFile("/settings/ignoreSubsequentSubEventsAfterCommunitySub");
    return ignoreSubEvents != null ? ignoreSubEvents : true;
};

settings.hasJustUpdated = function() {
    let updated = getDataFromFile("/settings/justUpdated");
    return updated != null ? updated : false;
};

settings.setJustUpdated = function(justUpdated) {
    pushDataToFile("/settings/justUpdated", justUpdated === true);
};

settings.getOverlayVersion = function() {
    let version = getDataFromFile("/settings/copiedOverlayVersion");
    return version != null ? version : "";
};

settings.setOverlayVersion = function(newVersion) {
    pushDataToFile("/settings/copiedOverlayVersion", newVersion.toString());
};

settings.getSparkExemptUsers = function() {
    let exemptUsers = getDataFromFile("/sparkExempt");
    return exemptUsers ? exemptUsers : { users: [] };
};

settings.getClearCustomScriptCache = function() {
    let clear = getDataFromFile("/settings/clearCustomScriptCache");
    return clear != null ? clear : false;
};

settings.setClearCustomScriptCache = function(clear) {
    pushDataToFile("/settings/clearCustomScriptCache", clear === true);
};

settings.getCustomScriptsEnabled = function() {
    return getDataFromFile("/settings/runCustomScripts") === true;
};

settings.setCustomScriptsEnabled = function(enabled) {
    pushDataToFile("/settings/runCustomScripts", enabled === true);
};

settings.getPersistCustomVariables = function() {
    return getDataFromFile("/settings/persistCustomVariables") === true;
};

settings.setPersistCustomVariables = function(enabled) {
    pushDataToFile("/settings/persistCustomVariables", enabled === true);
};

settings.useOverlayInstances = function() {
    let oi = getDataFromFile("/settings/useOverlayInstances");
    return oi != null ? oi : false;
};

settings.setUseOverlayInstances = function(oi) {
    pushDataToFile("/settings/useOverlayInstances", oi === true);
};

settings.getOverlayInstances = function() {
    let ois = getDataFromFile("/settings/overlayInstances");
    return ois != null ? ois : [];
};

settings.setOverlayInstances = function(ois) {
    pushDataToFile("/settings/overlayInstances", ois);
};

settings.backupKeepAll = function() {
    let backupKeepAll = getDataFromFile("/settings/backupKeepAll");
    return backupKeepAll != null ? backupKeepAll : false;
};

settings.backupOnExit = function() {
    let backupOnExit = getDataFromFile("/settings/backupOnExit");
    return backupOnExit != null ? backupOnExit : true;
};

settings.backupBeforeUpdates = function() {
    let backupBeforeUpdates = getDataFromFile("/settings/backupBeforeUpdates");
    return backupBeforeUpdates != null ? backupBeforeUpdates : true;
};

settings.backupOnceADay = function() {
    let backupOnceADay = getDataFromFile("/settings/backupOnceADay");
    return backupOnceADay != null ? backupOnceADay : true;
};

settings.setBackupOnceADay = function(backupOnceADay) {
    pushDataToFile("/settings/backupOnceADay", backupOnceADay === true);
};

settings.lastBackupDate = function() {
    let lastBackup = getDataFromFile("/settings/lastBackupDate");
    return lastBackup != null ? new Date(lastBackup) : null;
};

settings.setLastBackupDate = function(lastBackup) {
    pushDataToFile("/settings/lastBackupDate", lastBackup.toJSON());
};

settings.maxBackupCount = function() {
    let maxBackupCount = getDataFromFile("/settings/maxBackupCount");
    return maxBackupCount != null ? maxBackupCount : 25;
};

settings.setMaxBackupCount = function(maxBackupCount) {
    pushDataToFile("/settings/maxBackupCount", maxBackupCount);
};

settings.getAllowQuoteCSVDownloads = function() {
    return getDataFromFile("/settings/allowQuoteCSVDownloads") !== false;
};

settings.getActiveChatUserListTimeout = function() {
    let inactiveTimer = getDataFromFile("/settings/activeChatUsers/inactiveTimer");
    return inactiveTimer != null ? parseInt(inactiveTimer) : 5;
};

settings.getWebSocketPort = function() {
    let websocketPort = getDataFromFile("/settings/websocketPort");
    return websocketPort != null ? websocketPort : 8080;
};

settings.getWebServerPort = function() {
    let serverPort = getDataFromFile("/settings/webServerPort");
    return serverPort != null ? serverPort : 7472;
};

settings.getViewerDbStatus = function() {
    let status = getDataFromFile("/settings/viewerDB");
    return status != null ? status : true;
};

settings.getClipDownloadFolder = function() {
    const dataAccess = require("./data-access");
    let dlFolder = getDataFromFile('/settings/clips/downloadFolder');
    return dlFolder != null && dlFolder !== "" ? dlFolder : dataAccess.getPathInUserData("/clips/");
};

/*
* 0 = off,
* 1 = bugfix,
* 2 = feature,
* 3 = major release,
* 4 = betas
*/
settings.getAutoUpdateLevel = function() {
    let updateLevel = getDataFromFile("/settings/autoUpdateLevel");
    return updateLevel != null ? updateLevel : 2;
};

settings.getAudioOutputDevice = function() {
    let device = getDataFromFile("/settings/audioOutputDevice");
    return device != null
        ? device
        : { label: "System Default", deviceId: "default" };
};

settings.debugModeEnabled = function() {
    let enabled = getDataFromFile("/settings/debugMode");
    return enabled != null ? enabled : false;
};

settings.getExtraLifeParticipantId = function() {
    let id = getDataFromFile('/settings/extraLifeId');
    return id;
};

settings.setExtraLifeParticipantId = function(id) {
    pushDataToFile('/settings/extraLifeId', id);
};

settings.getWhileLoopEnabled = function() {
    let enabled = getDataFromFile('/settings/whileLoopEnabled');
    return enabled !== undefined ? enabled : false;
};

settings.setWhileLoopEnabled = function(enabled) {
    pushDataToFile('/settings/whileLoopEnabled', enabled === true);
};

/**@returns {string[]} */
settings.getSidebarControlledServices = function() {
    const services = getDataFromFile("/settings/sidebarControlledServices");
    return services != null
        ? services
        : ["chat"];
};

exports.settings = settings;
