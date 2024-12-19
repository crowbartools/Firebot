import fs from "fs";
import { JsonDB } from "node-json-db";
import logger from "../logwrapper";
import profileManager from "./profile-manager";
import frontendCommunicator from "./frontend-communicator";
import { SettingsDefaults, SettingsTypes } from "./settings-types";

interface SettingsData {
    path: string;
    data: unknown;
}

class SettingsManager {
    settingsCache = {};

    private getSettingsFile(): JsonDB {
        return profileManager.getJsonDbInProfile("/settings");
    }

    private handleCorruptSettingsFile() {
        logger.warn("settings.json file appears to be corrupt. Resetting file...");

        const settingsPath = profileManager.getPathInProfile("settings.json");
        fs.writeFileSync(settingsPath, JSON.stringify({
            settings: {
                firstTimeUse: false
            }
        }));
    }

    getDataFromFile(path: string, forceCacheUpdate = false, defaultValue = undefined) {
        try {
            if (this.settingsCache[path] == null || forceCacheUpdate) {
                const data = this.getSettingsFile().getData(path);
                this.settingsCache[path] = data ?? defaultValue;
            }
        } catch (err) {
            if (defaultValue !== undefined) {
                this.settingsCache[path] = defaultValue;
            }
            if (err.name !== "DataError") {
                logger.warn(err);
                if (
                    err.name === "DatabaseError" &&
                err.inner instanceof SyntaxError &&
                err.inner.stack.includes("JSON.parse")
                ) {
                    this.handleCorruptSettingsFile();
                }
            }
        }
        return this.settingsCache[path];
    }

    pushDataToFile(path: string, data: unknown) {
        try {
            this.getSettingsFile().push(path, data);
            this.settingsCache[path] = data;
            frontendCommunicator.send("settings-updated-main", { path, data });
        } catch (err) {
            logger.debug(err.message);
        }
    }

    flushSettingsCache() {
        this.settingsCache = {};
        frontendCommunicator.send("flush-settings-cache");
    }

    getSetting<Type extends keyof SettingsTypes>(settingName: Type): SettingsTypes[Type] {
        return this.getDataFromFile(settingName) ?? SettingsDefaults[settingName];
    }

    getAutoFlagBots = (): boolean => this.getSetting("AutoFlagBots");

    getEventSettings() {
        return this.getDataFromFile("/settings/eventSettings");
    }

    isCustomScriptsEnabled() {
        return this.getDataFromFile("/settings/runCustomScripts") === true;
    }

    ignoreSubsequentSubEventsAfterCommunitySub() {
        const ignoreSubEvents = this.getDataFromFile("/settings/ignoreSubsequentSubEventsAfterCommunitySub");
        return ignoreSubEvents != null ? ignoreSubEvents : true;
    }

    hasJustUpdated() {
        const updated = this.getDataFromFile("/settings/justUpdated");
        return updated != null ? updated : false;
    }

    setJustUpdated(justUpdated) {
        this.pushDataToFile("/settings/justUpdated", justUpdated === true);
    }

    getOverlayVersion() {
        const version = this.getDataFromFile("/settings/copiedOverlayVersion");
        return version != null ? version : "";
    }

    setOverlayVersion(newVersion) {
        this.pushDataToFile("/settings/copiedOverlayVersion", newVersion.toString());
    }

    getClearCustomScriptCache() {
        const clear = this.getDataFromFile("/settings/clearCustomScriptCache");
        return clear != null ? clear : false;
    }

    setClearCustomScriptCache(clear) {
        this.pushDataToFile("/settings/clearCustomScriptCache", clear === true);
    }

    getCustomScriptsEnabled() {
        return this.getDataFromFile("/settings/runCustomScripts") === true;
    }

    setCustomScriptsEnabled(enabled) {
        this.pushDataToFile("/settings/runCustomScripts", enabled === true);
    }

    getPersistCustomVariables() {
        return this.getDataFromFile("/settings/persistCustomVariables") === true;
    }

    setPersistCustomVariables(enabled) {
        this.pushDataToFile("/settings/persistCustomVariables", enabled === true);
    }

    useOverlayInstances() {
        const oi = this.getDataFromFile("/settings/useOverlayInstances");
        return oi != null ? oi : false;
    }

    setUseOverlayInstances(oi) {
        this.pushDataToFile("/settings/useOverlayInstances", oi === true);
    }

    getOverlayInstances() {
        const ois = this.getDataFromFile("/settings/overlayInstances");
        return ois != null ? ois : [];
    }

    setOverlayInstances(ois) {
        this.pushDataToFile("/settings/overlayInstances", ois);
    }

    getForceOverlayEffectsToContinueOnRefresh() {
        const forceOverlayEffectsToContinueOnRefresh = this.getDataFromFile("/settings/forceOverlayEffectsToContinueOnRefresh", false, true);
        return forceOverlayEffectsToContinueOnRefresh === true;
    }

    setForceOverlayEffectsToContinueOnRefresh(value) {
        this.pushDataToFile("/settings/forceOverlayEffectsToContinueOnRefresh", value);
    }

    backupLocation() {
        const backupLocation = this.getDataFromFile("/settings/backupLocation");
        return backupLocation != null ? backupLocation : undefined;
    }

    backupKeepAll() {
        const backupKeepAll = this.getDataFromFile("/settings/backupKeepAll");
        return backupKeepAll != null ? backupKeepAll : false;
    }

    backupOnExit() {
        const backupOnExit = this.getDataFromFile("/settings/backupOnExit");
        return backupOnExit != null ? backupOnExit : true;
    }

    backupIgnoreResources() {
        const save = this.getDataFromFile("/settings/backupIgnoreResources");
        return save != null ? save : true;
    }

    setBackupIgnoreResources(backupIgnoreResources) {
        this.pushDataToFile("/settings/backupIgnoreResources", backupIgnoreResources === false);
    }

    backupBeforeUpdates() {
        const backupBeforeUpdates = this.getDataFromFile("/settings/backupBeforeUpdates");
        return backupBeforeUpdates != null ? backupBeforeUpdates : true;
    }

    backupOnceADay() {
        const backupOnceADay = this.getDataFromFile("/settings/backupOnceADay");
        return backupOnceADay != null ? backupOnceADay : true;
    }

    setBackupOnceADay(backupOnceADay) {
        this.pushDataToFile("/settings/backupOnceADay", backupOnceADay === true);
    }

    lastBackupDate() {
        const lastBackup = this.getDataFromFile("/settings/lastBackupDate");
        return lastBackup != null ? new Date(lastBackup) : null;
    }

    setLastBackupDate(lastBackup) {
        this.pushDataToFile("/settings/lastBackupDate", lastBackup.toJSON());
    }

    maxBackupCount() {
        const maxBackupCount = this.getDataFromFile("/settings/maxBackupCount");
        return maxBackupCount != null ? maxBackupCount : 25;
    }

    setMaxBackupCount(maxBackupCount) {
        this.pushDataToFile("/settings/maxBackupCount", maxBackupCount);
    }

    getAllowQuoteCSVDownloads() {
        return this.getDataFromFile("/settings/allowQuoteCSVDownloads") !== false;
    }

    getActiveChatUserListTimeout() {
        const inactiveTimer = this.getDataFromFile("/settings/activeChatUsers/inactiveTimer");
        return inactiveTimer != null ? parseInt(inactiveTimer) : 5;
    }

    getWebSocketPort() {
        const websocketPort = this.getDataFromFile("/settings/websocketPort");
        return websocketPort != null ? websocketPort : 8080;
    }

    getWebServerPort() {
        return this.getSetting("WebServerPort");
        const serverPort = this.getDataFromFile("/settings/webServerPort");
        return serverPort != null ? serverPort : 7472;
    }

    getViewerDbStatus() {
        const status = this.getDataFromFile("/settings/viewerDB");
        return status != null ? status : true;
    }

    /*
    * 0 = off,
    * 1 = bugfix,
    * 2 = feature,
    * 3 = major release,
    * 4 = betas
    */
    getAutoUpdateLevel() {
        const updateLevel = this.getDataFromFile("/settings/autoUpdateLevel");
        return updateLevel != null ? updateLevel : 2;
    }

    getAudioOutputDevice() {
        const device = this.getDataFromFile("/settings/audioOutputDevice");
        return device != null
            ? device
            : { label: "System Default", deviceId: "default" };
    }

    debugModeEnabled(): boolean {
        const enabled = this.getDataFromFile("/settings/debugMode");
        return enabled != null ? enabled : false;
    }

    getWhileLoopEnabled(): boolean {
        const enabled = this.getDataFromFile("/settings/whileLoopEnabled");
        return enabled !== undefined ? enabled : false;
    }

    setWhileLoopEnabled(enabled: boolean) {
        this.pushDataToFile("/settings/whileLoopEnabled", enabled === true);
    }

    getSidebarControlledServices(): string[] {
        const services = this.getDataFromFile("/settings/sidebarControlledServices");
        return services != null
            ? services
            : ["chat"];
    }

    getMinimizeToTray() {
        const minimizeToTray = this.getDataFromFile("/settings/minimizeToTray");
        return minimizeToTray === true;
    }
    setMinimizeToTray(minimizeToTray) {
        this.pushDataToFile("/settings/minimizeToTray", minimizeToTray === true);
    }

    getOpenStreamPreviewOnLaunch() {
        const openStreamPreviewOnLaunch = this.getDataFromFile("/settings/openStreamPreviewOnLaunch", false, false);
        return openStreamPreviewOnLaunch === true;
    }

    setOpenStreamPreviewOnLaunch(enabled: boolean) {
        this.pushDataToFile("/settings/openStreamPreviewOnLaunch", enabled === true);
    }

    getQuickActionSettings() {
        return this.getDataFromFile("/settings/quickActions");
    }

    setQuickActionSettings(quickActions) {
        this.pushDataToFile("/settings/quickActions", quickActions);
    }

    getWebOnlineCheckin() {
        const webOnlineCheckin = this.getDataFromFile("/settings/webOnlineCheckin");
        return webOnlineCheckin === true;
    }

    setWebOnlineCheckin(value: boolean) {
        this.pushDataToFile("/settings/webOnlineCheckin", value);
    }

    getTriggerUpcomingAdBreakMinutes() {
        const value = this.getDataFromFile("/settings/triggerUpcomingAdBreakMinutes", false, 0);
        return value ?? 0;
    }

    setTriggerUpcomingAdBreakMinutes(value: number) {
        this.pushDataToFile("/settings/triggerUpcomingAdBreakMinutes", value);
    }

    getAllowCommandsInSharedChat() {
        return this.getDataFromFile("/settings/allowCommandsInSharedChat", false, false); // default OFF
    }

    setAllowCommandsInSharedChat(value: boolean) {
        this.pushDataToFile("/settings/allowCommandsInSharedChat", value);
    }
}

const settings = new SettingsManager();


frontendCommunicator.on("settings:get-all-setting-values", () => {
    return settings.settingsCache;
});

frontendCommunicator.onAsync("settings:get-setting-value", async (settingName: keyof SettingsTypes) => {
    return settings.getSetting(settingName);
});

frontendCommunicator.on("settings-updated-renderer", (settingsUpdate: SettingsData) => {
    if (settingsUpdate == null) {
        return;
    }
    const { path, data } = settingsUpdate;
    if (path == null || path === "") {
        return;
    }
    settings.settingsCache[path] = data;
});

frontendCommunicator.on("purge-settings-cache", () => {
    settings.flushSettingsCache();
});

exports.settings = settings;
