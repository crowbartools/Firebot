"use strict";

const profileManager = require("./profile-manager");
const logger = require("../logwrapper");
const frontendCommunicator = require("./frontend-communicator");
const fs = require("fs");

// This file centralizes access to the settings db
// We will need to refactor other files to use this.
const settings = {};

let settingsCache = {};

settings.flushSettingsCache = function () {
    settingsCache = {};
    frontendCommunicator.send("flush-settings-cache");
};

frontendCommunicator.on("settings-updated-renderer", (settingsUpdate) => {
    if (settingsUpdate == null) {
        return;
    }
    const { path, data } = settingsUpdate;
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


function handleCorruptSettingsFile() {
    logger.warn("settings.json file appears to be corrupt. Resetting file...");

    const settingsPath = profileManager.getPathInProfile("settings.json");
    fs.writeFileSync(settingsPath, JSON.stringify({
        settings: {
            firstTimeUse: false
        }
    }));
}

function getDataFromFile(path, forceCacheUpdate = false, defaultValue = undefined) {
    try {
        if (settingsCache[path] == null || forceCacheUpdate) {
            const data = getSettingsFile().getData(path);
            settingsCache[path] = data ?? defaultValue;
        }
    } catch (err) {
        if (defaultValue !== undefined) {
            settingsCache[path] = defaultValue;
        }
        if (err.name !== "DataError") {
            logger.warn(err);
            if (
                err.name === 'DatabaseError' &&
                err.inner instanceof SyntaxError &&
                err.inner.stack.includes('JSON.parse')
            ) {
                handleCorruptSettingsFile();
            }
        }
    }
    return settingsCache[path];
}

settings.getAutoFlagBots = function () {
    const autoFlagBots = getDataFromFile("/settings/autoFlagBots");
    return autoFlagBots != null ? autoFlagBots : true;
};

settings.getEventSettings = function () {
    return getDataFromFile("/settings/eventSettings");
};

settings.isCustomScriptsEnabled = function () {
    return getDataFromFile("/settings/runCustomScripts") === true;
};

settings.setCustomScriptsEnabled = function (enabled) {
    pushDataToFile("/settings/runCustomScripts", enabled === true);
};

settings.ignoreSubsequentSubEventsAfterCommunitySub = function () {
    const ignoreSubEvents = getDataFromFile("/settings/ignoreSubsequentSubEventsAfterCommunitySub");
    return ignoreSubEvents != null ? ignoreSubEvents : true;
};

settings.hasJustUpdated = function () {
    const updated = getDataFromFile("/settings/justUpdated");
    return updated != null ? updated : false;
};

settings.setJustUpdated = function (justUpdated) {
    pushDataToFile("/settings/justUpdated", justUpdated === true);
};

settings.getOverlayVersion = function () {
    const version = getDataFromFile("/settings/copiedOverlayVersion");
    return version != null ? version : "";
};

settings.setOverlayVersion = function (newVersion) {
    pushDataToFile("/settings/copiedOverlayVersion", newVersion.toString());
};

settings.getClearCustomScriptCache = function () {
    const clear = getDataFromFile("/settings/clearCustomScriptCache");
    return clear != null ? clear : false;
};

settings.setClearCustomScriptCache = function (clear) {
    pushDataToFile("/settings/clearCustomScriptCache", clear === true);
};

settings.getCustomScriptsEnabled = function () {
    return getDataFromFile("/settings/runCustomScripts") === true;
};

settings.setCustomScriptsEnabled = function (enabled) {
    pushDataToFile("/settings/runCustomScripts", enabled === true);
};

settings.getPersistCustomVariables = function () {
    return getDataFromFile("/settings/persistCustomVariables") === true;
};

settings.setPersistCustomVariables = function (enabled) {
    pushDataToFile("/settings/persistCustomVariables", enabled === true);
};

settings.useOverlayInstances = function () {
    const oi = getDataFromFile("/settings/useOverlayInstances");
    return oi != null ? oi : false;
};

settings.setUseOverlayInstances = function (oi) {
    pushDataToFile("/settings/useOverlayInstances", oi === true);
};

settings.getOverlayInstances = function () {
    const ois = getDataFromFile("/settings/overlayInstances");
    return ois != null ? ois : [];
};

settings.setOverlayInstances = function (ois) {
    pushDataToFile("/settings/overlayInstances", ois);
};

settings.getForceOverlayEffectsToContinueOnRefresh = function () {
    const forceOverlayEffectsToContinueOnRefresh = getDataFromFile("/settings/forceOverlayEffectsToContinueOnRefresh", false, true);
    return forceOverlayEffectsToContinueOnRefresh === true;
};

settings.setForceOverlayEffectsToContinueOnRefresh = function (value) {
    pushDataToFile("/settings/forceOverlayEffectsToContinueOnRefresh", value);
};

settings.backupKeepAll = function () {
    const backupKeepAll = getDataFromFile("/settings/backupKeepAll");
    return backupKeepAll != null ? backupKeepAll : false;
};

settings.backupOnExit = function () {
    const backupOnExit = getDataFromFile("/settings/backupOnExit");
    return backupOnExit != null ? backupOnExit : true;
};

settings.backupIgnoreResources = function () {
    const save = getDataFromFile("/settings/backupIgnoreResources");
    return save != null ? save : true;
};

settings.setBackupIgnoreResources = function (backupIgnoreResources) {
    pushDataToFile("/settings/backupIgnoreResources", backupIgnoreResources === false);
};

settings.backupBeforeUpdates = function () {
    const backupBeforeUpdates = getDataFromFile("/settings/backupBeforeUpdates");
    return backupBeforeUpdates != null ? backupBeforeUpdates : true;
};

settings.backupOnceADay = function () {
    const backupOnceADay = getDataFromFile("/settings/backupOnceADay");
    return backupOnceADay != null ? backupOnceADay : true;
};

settings.setBackupOnceADay = function (backupOnceADay) {
    pushDataToFile("/settings/backupOnceADay", backupOnceADay === true);
};

settings.lastBackupDate = function () {
    const lastBackup = getDataFromFile("/settings/lastBackupDate");
    return lastBackup != null ? new Date(lastBackup) : null;
};

settings.setLastBackupDate = function (lastBackup) {
    pushDataToFile("/settings/lastBackupDate", lastBackup.toJSON());
};

settings.maxBackupCount = function () {
    const maxBackupCount = getDataFromFile("/settings/maxBackupCount");
    return maxBackupCount != null ? maxBackupCount : 25;
};

settings.setMaxBackupCount = function (maxBackupCount) {
    pushDataToFile("/settings/maxBackupCount", maxBackupCount);
};

settings.getAllowQuoteCSVDownloads = function () {
    return getDataFromFile("/settings/allowQuoteCSVDownloads") !== false;
};

settings.getActiveChatUserListTimeout = function () {
    const inactiveTimer = getDataFromFile("/settings/activeChatUsers/inactiveTimer");
    return inactiveTimer != null ? parseInt(inactiveTimer) : 5;
};

settings.getWebSocketPort = function () {
    const websocketPort = getDataFromFile("/settings/websocketPort");
    return websocketPort != null ? websocketPort : 8080;
};

settings.getWebServerPort = function () {
    const serverPort = getDataFromFile("/settings/webServerPort");
    return serverPort != null ? serverPort : 7472;
};

settings.getViewerDbStatus = function () {
    const status = getDataFromFile("/settings/viewerDB");
    return status != null ? status : true;
};

/*
* 0 = off,
* 1 = bugfix,
* 2 = feature,
* 3 = major release,
* 4 = betas
*/
settings.getAutoUpdateLevel = function () {
    const updateLevel = getDataFromFile("/settings/autoUpdateLevel");
    return updateLevel != null ? updateLevel : 2;
};

settings.getAudioOutputDevice = function () {
    const device = getDataFromFile("/settings/audioOutputDevice");
    return device != null
        ? device
        : { label: "System Default", deviceId: "default" };
};

settings.debugModeEnabled = function () {
    const enabled = getDataFromFile("/settings/debugMode");
    return enabled != null ? enabled : false;
};

settings.getWhileLoopEnabled = function () {
    const enabled = getDataFromFile('/settings/whileLoopEnabled');
    return enabled !== undefined ? enabled : false;
};

settings.setWhileLoopEnabled = function (enabled) {
    pushDataToFile('/settings/whileLoopEnabled', enabled === true);
};

/**@returns {string[]} */
settings.getSidebarControlledServices = function () {
    const services = getDataFromFile("/settings/sidebarControlledServices");
    return services != null
        ? services
        : ["chat"];
};

settings.getMinimizeToTray = function () {
    const minimizeToTray = getDataFromFile('/settings/minimizeToTray');
    return minimizeToTray === true;
};
settings.setMinimizeToTray = function (minimizeToTray) {
    pushDataToFile('/settings/minimizeToTray', minimizeToTray === true);
};

settings.getOpenStreamPreviewOnLaunch = () => {
    const openStreamPreviewOnLaunch = getDataFromFile("/settings/openStreamPreviewOnLaunch", false, false);
    return openStreamPreviewOnLaunch === true;
};
settings.setOpenStreamPreviewOnLaunch = (enabled) => {
    pushDataToFile("/settings/openStreamPreviewOnLaunch", enabled === true);
};

settings.getQuickActionSettings = () => {
    return getDataFromFile("/settings/quickActions");
};

settings.setQuickActionSettings = (quickActions) => {
    pushDataToFile("/settings/quickActions", quickActions);
};

settings.getWebOnlineCheckin = () => {
    const webOnlineCheckin = getDataFromFile("/settings/webOnlineCheckin");
    return webOnlineCheckin === true;
};

settings.setWebOnlineCheckin = (value) => {
    pushDataToFile("/settings/webOnlineCheckin", value);
};

settings.getTriggerUpcomingAdBreakMinutes = function () {
    const value = getDataFromFile("/settings/triggerUpcomingAdBreakMinutes", false, 0);
    return value ?? 0;
};

settings.setTriggerUpcomingAdBreakMinutes = function (value) {
    pushDataToFile("/settings/triggerUpcomingAdBreakMinutes", value);
};

settings.getAllowCommandsInSharedChat = function () {
    return getDataFromFile("/settings/allowCommandsInSharedChat", false, false); // default OFF
};

settings.setAllowCommandsInSharedChat = function (value) {
    pushDataToFile("/settings/allowCommandsInSharedChat", value);
};

exports.settings = settings;
