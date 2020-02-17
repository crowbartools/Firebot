"use strict";

const profileManager = require("./profile-manager");
const logger = require("../logwrapper");

// This file centralizes access to the settings db
// We will need to refactor other files to use this.
let settings = {};

function getSettingsFile() {
    return profileManager.getJsonDbInProfile("/settings");
}

function pushDataToFile(path, data) {
    try {
        getSettingsFile().push(path, data);
    } catch (err) {
        logger.debug(err.message);
    }
}

function getDataFromFile(path) {
    let data = null;
    try {
        data = getSettingsFile().getData(path);
    } catch (err) {
        logger.debug(err.message);
    }
    return data;
}

settings.getEventSettings = function() {
    return getDataFromFile("/settings/eventSettings");
};

settings.isCustomScriptsEnabled = function() {
    return getDataFromFile("/settings/runCustomScripts") === true;
};

settings.setCustomScriptsEnabled = function(enabled) {
    pushDataToFile("/settings/runCustomScripts", enabled === true);
};

settings.getLastMixplayProjectId = function() {
    let projectId;
    try {
        projectId = getSettingsFile().getData("/mixplay/lastProjectId");
    } catch (err) {
        logger.debug(err);
    }
    return projectId;
};

settings.setLastMixplayProjectId = function(id) {
    pushDataToFile("/mixplay/lastProjectId", id);
};

settings.getActiveMixplayProjectId = function() {
    let projectId;
    try {
        projectId = getSettingsFile().getData("/mixplay/activeProjectId");
    } catch (err) {
        logger.warn(err);
    }
    return projectId;
};

settings.setActiveMixplayProjectId = function(id) {
    pushDataToFile("/mixplay/activeProjectId", id);
};

settings.getLastBoardName = function() {
    let boardName = getDataFromFile("/interactive/lastBoardId");
    return boardName != null ? boardName : "";
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

settings.getActiveChatUserListEnabled = function() {
    let enabled = getDataFromFile("/settings/activeChatUsers/status");
    return enabled != null ? enabled : true;
};

settings.getActiveChatUserListTimeout = function() {
    let inactiveTimer = getDataFromFile("/settings/activeChatUsers/inactiveTimer");
    return inactiveTimer != null ? parseInt(inactiveTimer) : 10;
};

settings.getActiveMixplayUserListEnabled = function() {
    let enabled = getDataFromFile("/settings/activeMixplayUsers/status");
    return enabled !== undefined ? enabled : true;
};

settings.getActiveMixplayUserListTimeout = function() {
    let inactiveTimer = getDataFromFile("/settings/activeMixplayUsers/inactiveTimer");
    return inactiveTimer != null ? parseInt(inactiveTimer) : 10;
};

settings.sparkExemptionEnabled = function() {
    let enabled = getDataFromFile('/settings/sparkExemptionEnabled');
    return enabled != null ? enabled : false;
};

settings.setSparkExemptionEnabled = function(enabled) {
    pushDataToFile('/settings/sparkExemptionEnabled', enabled === true);
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
    let dlFolder = getDataFromFile('/settings/clips/downloadFolder');
    return dlFolder != null && dlFolder !== "" ? dlFolder : profileManager.getPathInProfile("/clips/");
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

exports.settings = settings;
