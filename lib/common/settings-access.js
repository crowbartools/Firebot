'use strict';

const dataAccess = require('./data-access');
const logger = require('../logwrapper');

// This file centralizes access to the settings db
// We will need to refactor other files to use this.
let settings = {};

function getSettingsFile() {
    return dataAccess.getJsonDbInUserData("/user-settings/settings");
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

settings.getEventSettings = function () {
    return getDataFromFile('/settings/eventSettings');
};

settings.isCustomScriptsEnabled = function() {
    return getDataFromFile('/settings/runCustomScripts') === true;
};

settings.setCustomScriptsEnabled = function(enabled) {
    pushDataToFile('/settings/runCustomScripts', enabled === true);
};

settings.getLastBoardName = function() {
    let boardName = getDataFromFile('/interactive/lastBoardId');
    return boardName != null ? boardName : "";
};

settings.hasJustUpdated = function() {
    let updated = getDataFromFile('/settings/justUpdated');
    return updated != null ? updated : false;
};

settings.setJustUpdated = function(justUpdated) {
    pushDataToFile('/settings/justUpdated', justUpdated === true);
};

settings.getOverlayVersion = function() {
    let version = getDataFromFile('/settings/copiedOverlayVersion');
    return version != null ? version : "";
};

settings.setOverlayVersion = function(newVersion) {
    pushDataToFile('/settings/copiedOverlayVersion', newVersion.toString());
};

settings.getSparkExemptUsers = function() {
    let exemptUsers = getDataFromFile("/sparkExempt");
    return exemptUsers ? exemptUsers : { users: [] };
};

settings.getClearCustomScriptCache = function() {
    let clear = getDataFromFile('/settings/clearCustomScriptCache');
    return clear != null ? clear : false;
};

settings.setClearCustomScriptCache = function(clear) {
    pushDataToFile('/settings/clearCustomScriptCache', clear === true);
};

settings.useOverlayInstances = function() {
    let oi = getDataFromFile('/settings/useOverlayInstances');
    return oi != null ? oi : false;
};

settings.getOverlayInstances = function() {
    let ois = getDataFromFile('/settings/overlayInstances');
    return ois != null ? ois : [];
};

settings.backupKeepAll = function() {
    let backupKeepAll = getDataFromFile('/settings/backupKeepAll');
    return backupKeepAll != null ? backupKeepAll : false;
};

settings.backupOnExit = function() {
    let backupOnExit = getDataFromFile('/settings/backupOnExit');
    return backupOnExit != null ? backupOnExit : true;
};

settings.backupBeforeUpdates = function() {
    let backupBeforeUpdates = getDataFromFile('/settings/backupBeforeUpdates');
    return backupBeforeUpdates != null ? backupBeforeUpdates : true;
};

settings.backupOnceADay = function() {
    let backupOnceADay = getDataFromFile('/settings/backupOnceADay');
    return backupOnceADay != null ? backupOnceADay : true;
};

settings.setBackupOnceADay = function(backupOnceADay) {
    pushDataToFile('/settings/backupOnceADay', backupOnceADay === true);
};

settings.lastBackupDate = function() {
    let lastBackup = getDataFromFile('/settings/lastBackupDate');
    return lastBackup != null ? new Date(lastBackup) : null;
};

settings.setLastBackupDate = function(lastBackup) {
    pushDataToFile('/settings/lastBackupDate', lastBackup.toJSON());
};

settings.maxBackupCount = function() {
    let maxBackupCount = getDataFromFile('/settings/maxBackupCount');
    return maxBackupCount != null ? maxBackupCount : 25;
};

settings.setMaxBackupCount = function(maxBackupCount) {
    pushDataToFile('/settings/maxBackupCount', maxBackupCount);
};

settings.getWebSocketPort = function() {
    let websocketPort = getDataFromFile('/settings/websocketPort');
    return websocketPort != null ? websocketPort : 8080;
};

settings.getWebServerPort = function() {
    let serverPort = getDataFromFile('/settings/webServerPort');
    return serverPort != null ? serverPort : 7473;
};

settings.getClipDownloadFolder = function() {
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
    let updateLevel = getDataFromFile('/settings/autoUpdateLevel');
    return updateLevel != null ? updateLevel : 2;
};

settings.getAudioOutputDevice = function() {
    let device = getDataFromFile('/settings/audioOutputDevice');
    return device != null ? device : { label: "System Default", deviceId: "default"};
};

settings.debugModeEnabled = function() {
    let enabled = getDataFromFile('/settings/debugMode');
    return enabled != null ? enabled : false;
};

exports.settings = settings;
