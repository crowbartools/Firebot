import { JsonDB } from "node-json-db";
import fs from "fs";
import logger from "../logwrapper";
import profileManager from "./profile-manager";
import frontendCommunicator from "./frontend-communicator";
import {
    FirebotAutoUpdateLevel,
    FirebotSettingsDefaults,
    FirebotSettingsPaths,
    FirebotSettingsTypes
} from "./settings-types";

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

    private getDataFromFile(path: string, forceCacheUpdate = false, defaultValue = undefined) {
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

    private pushDataToFile(path: string, data: unknown) {
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

    /**
     * Get the JSON data path for a specific Firebot setting in the settings file
     *
     * @param settingName Name of the setting
     * @returns String representing the full JSON path of the setting data
     */
    getSettingPath(settingName: string) {
        return FirebotSettingsPaths[settingName] ?? `/settings/${settingName[0].toLowerCase()}${settingName.slice(1)}`;
    }

    /**
     * Get a Firebot setting value or its default
     *
     * @param settingName Name of the setting to get
     * @param forceCacheUpdate Force an update to the settings cache. Defaults to `false`.
     * @returns Setting value, or the default if one isn't explicitly set
     */
    getSetting<SettingName extends keyof FirebotSettingsTypes>(settingName: SettingName, forceCacheUpdate = false): FirebotSettingsTypes[SettingName] {
        const value = this.getDataFromFile(this.getSettingPath(settingName), forceCacheUpdate, FirebotSettingsDefaults[settingName]);

        // Eventually, when we upgrade node-json-db, the library will handle this for us
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/m.exec(value)) {
            // This is a load-bearing cast
            return new Date(value) as FirebotSettingsTypes[SettingName];
        }

        return value;
    }

    /**
     * Save a Firebot setting
     *
     * @param settingName Name of the setting to save
     * @param data Setting data
     */
    saveSetting<SettingName extends keyof FirebotSettingsTypes>(settingName: SettingName, data: FirebotSettingsTypes[SettingName]): void {
        this.pushDataToFile(this.getSettingPath(settingName), data);
    }


    // Everything below this is older, deprecated functions. Leaving them for back compat.
    // You should use either getSetting or saveSetting with the relevant setting name.

    /** @deprecated Use `getSetting("AutoFlagBots")` instead */
    getAutoFlagBots(): boolean {
        return this.getSetting("AutoFlagBots");
    }

    /** @deprecated Use `getSetting("EventSettings")` instead */
    getEventSettings() {
        return this.getSetting("EventSettings");
    }

    /** @deprecated Use `getSetting("IgnoreSubsequentSubEventsAfterCommunitySub")` instead */
    ignoreSubsequentSubEventsAfterCommunitySub() {
        return this.getSetting("IgnoreSubsequentSubEventsAfterCommunitySub");
    }

    /** @deprecated Use `getSetting("JustUpdated")` instead */
    hasJustUpdated(): boolean {
        return this.getSetting("JustUpdated");
    }

    /** @deprecated Use `saveSetting("JustUpdated", value)` instead */
    setJustUpdated(justUpdated: boolean) {
        this.saveSetting("JustUpdated", justUpdated);
    }

    /** @deprecated Use `getSetting("CopiedOverlayVersion")` instead */
    getOverlayVersion() {
        return this.getSetting("CopiedOverlayVersion");
    }

    /** @deprecated Use `saveSetting("CopiedOverlayVersion", value)` instead */
    setOverlayVersion(newVersion: string) {
        this.saveSetting("CopiedOverlayVersion", newVersion);
    }

    /** @deprecated Use `getSetting("ClearCustomScriptCache")` instead */
    getClearCustomScriptCache() {
        return this.getSetting("ClearCustomScriptCache");
    }

    /** @deprecated Use `saveSetting("ClearCustomScriptCache", value)` instead */
    setClearCustomScriptCache(clear: boolean) {
        this.saveSetting("ClearCustomScriptCache", clear);
    }

    /** @deprecated Use `getSetting("RunCustomScripts")` instead */
    isCustomScriptsEnabled() {
        return this.getSetting("RunCustomScripts");
    }

    /** @deprecated Use `getSetting("RunCustomScripts")` instead */
    getCustomScriptsEnabled() {
        return this.getSetting("RunCustomScripts");
    }

    /** @deprecated Use `saveSetting("RunCustomScripts", value)` instead */
    setCustomScriptsEnabled(enabled: boolean) {
        this.saveSetting("RunCustomScripts", enabled);
    }

    /** @deprecated Use `getSetting("PersistCustomVariables")` instead */
    getPersistCustomVariables() {
        return this.getSetting("PersistCustomVariables");
    }

    /** @deprecated Use `saveSetting("PersistCustomVariables", value)` instead */
    setPersistCustomVariables(enabled: boolean) {
        this.saveSetting("PersistCustomVariables", enabled);
    }

    /** @deprecated Use `getSetting("UseOverlayInstances")` instead */
    useOverlayInstances(): boolean {
        return this.getSetting("UseOverlayInstances");
    }

    /** @deprecated Use `saveSetting("UseOverlayInstances", value)` instead */
    setUseOverlayInstances(oi: boolean) {
        this.saveSetting("UseOverlayInstances", oi);
    }

    /** @deprecated Use `getSetting("OverlayInstances")` instead */
    getOverlayInstances() {
        return this.getSetting("OverlayInstances");
    }

    /** @deprecated Use `saveSetting("OverlayInstances", value)` instead */
    setOverlayInstances(ois: string[]) {
        this.saveSetting("OverlayInstances", ois);
    }

    /** @deprecated Use `getSetting("ForceOverlayEffectsToContinueOnRefresh")` instead */
    getForceOverlayEffectsToContinueOnRefresh() {
        return this.getSetting("ForceOverlayEffectsToContinueOnRefresh");
    }

    /** @deprecated Use `saveSetting("ForceOverlayEffectsToContinueOnRefresh", value)` instead */
    setForceOverlayEffectsToContinueOnRefresh(value: boolean) {
        this.saveSetting("ForceOverlayEffectsToContinueOnRefresh", value);
    }

    /** @deprecated Use `getSetting("BackupKeepAll")` instead */
    backupKeepAll() {
        return this.getSetting("BackupKeepAll");
    }

    /** @deprecated Use `getSetting("BackupOnExit")` instead */
    backupOnExit() {
        return this.getSetting("BackupOnExit");
    }

    /** @deprecated Use `getSetting("BackupIgnoreResources")` instead */
    backupIgnoreResources() {
        return this.getSetting("BackupIgnoreResources");
    }

    /** @deprecated Use `saveSetting("BackupIgnoreResources", value)` instead */
    setBackupIgnoreResources(backupIgnoreResources: boolean) {
        this.saveSetting("BackupIgnoreResources", backupIgnoreResources);
    }

    /** @deprecated Use `getSetting("BackupBeforeUpdates")` instead */
    backupBeforeUpdates() {
        return this.getSetting("BackupBeforeUpdates");
    }

    /** @deprecated Use `getSetting("BackupOnceADay")` instead */
    backupOnceADay() {
        return this.getSetting("BackupOnceADay");
    }

    /** @deprecated Use `saveSetting("BackupOnceADay", value)` instead */
    setBackupOnceADay(backupOnceADay: boolean) {
        this.saveSetting("BackupOnceADay", backupOnceADay);
    }

    /** @deprecated Use `getSetting("LastBackupDate")` instead */
    lastBackupDate() {
        return this.getSetting("LastBackupDate");
    }

    /** @deprecated Use `saveSetting("LastBackupDate", value)` instead */
    setLastBackupDate(lastBackup) {
        this.saveSetting("LastBackupDate", lastBackup);
    }

    /** @deprecated Use `getSetting("MaxBackupCount")` instead */
    maxBackupCount() {
        return this.getSetting("MaxBackupCount");
    }

    /** @deprecated Use `getSetting("MaxBackupCount")` instead */
    setMaxBackupCount(maxBackupCount: number) {
        this.saveSetting("MaxBackupCount", maxBackupCount);
    }

    /** @deprecated Use `getSetting("AllowQuoteCSVDownloads")` instead */
    getAllowQuoteCSVDownloads() {
        return this.getSetting("AllowQuoteCSVDownloads");
    }

    /** @deprecated Use `getSetting("ActiveChatUserListTimeout")` instead */
    getActiveChatUserListTimeout() {
        return this.getSetting("ActiveChatUserListTimeout");
    }

    /** @deprecated Use `getSetting("WebsocketPort")` instead */
    getWebSocketPort() {
        return this.getSetting("WebsocketPort");
    }

    /** @deprecated Use `getSetting("WebServerPort")` instead */
    getWebServerPort() {
        return this.getSetting("WebServerPort");
    }

    /** @deprecated Use `getSetting("ViewerDB")` instead */
    getViewerDbStatus() {
        return this.getSetting("ViewerDB");
    }

    /** @deprecated Use `getSetting("AutoUpdateLevel")` instead */
    getAutoUpdateLevel(): FirebotAutoUpdateLevel {
        return this.getSetting("AutoUpdateLevel");
    }

    /** @deprecated Use `getSetting("AudioOutputDevice")` instead */
    getAudioOutputDevice() {
        return this.getSetting("AudioOutputDevice");
    }

    /** @deprecated Use `getSetting("DebugMode")` instead */
    debugModeEnabled(): boolean {
        return this.getSetting("DebugMode");
    }

    /** @deprecated Use `getSetting("WhileLoopEnabled")` instead */
    getWhileLoopEnabled(): boolean {
        return this.getSetting("WhileLoopEnabled");
    }

    /** @deprecated Use `saveSetting("WhileLoopEnabled", value)` instead */
    setWhileLoopEnabled(enabled: boolean) {
        this.saveSetting("WhileLoopEnabled", enabled);
    }

    /** @deprecated Use `getSetting("SidebarControlledServices")` instead */
    getSidebarControlledServices(): string[] {
        return this.getSetting("SidebarControlledServices");
    }

    /** @deprecated Use `getSetting("MinimizeToTray")` instead */
    getMinimizeToTray() {
        return this.getSetting("MinimizeToTray");
    }

    /** @deprecated Use `saveSetting("MinimizeToTray", value)` instead */
    setMinimizeToTray(minimizeToTray: boolean) {
        this.saveSetting("MinimizeToTray", minimizeToTray);
    }

    /** @deprecated Use `getSetting("OpenStreamPreviewOnLaunch")` instead */
    getOpenStreamPreviewOnLaunch() {
        return this.getSetting("OpenStreamPreviewOnLaunch");
    }

    /** @deprecated Use `saveSetting("OpenStreamPreviewOnLaunch", value)` instead */
    setOpenStreamPreviewOnLaunch(enabled: boolean) {
        this.saveSetting("OpenStreamPreviewOnLaunch", enabled);
    }

    /** @deprecated Use `getSetting("QuickActions")` instead */
    getQuickActionSettings() {
        return this.getSetting("QuickActions");
    }

    /** @deprecated Use `saveSetting("QuickActions", value)` instead */
    setQuickActionSettings(quickActions) {
        this.saveSetting("QuickActions", quickActions);
    }

    /** @deprecated Use `getSetting("WebOnlineCheckin")` instead */
    getWebOnlineCheckin() {
        return this.getSetting("WebOnlineCheckin");
    }

    /** @deprecated Use `saveSetting("WebOnlineCheckin", value)` instead */
    setWebOnlineCheckin(value: boolean) {
        this.saveSetting("WebOnlineCheckin", value);
    }

    /** @deprecated Use `getSetting("TriggerUpcomingAdBreakMinutes")` instead */
    getTriggerUpcomingAdBreakMinutes() {
        return this.getSetting("TriggerUpcomingAdBreakMinutes");
    }

    /** @deprecated Use `saveSetting("TriggerUpcomingAdBreakMinutes", value)` instead */
    setTriggerUpcomingAdBreakMinutes(value: number) {
        this.saveSetting("TriggerUpcomingAdBreakMinutes", value);
    }

    /** @deprecated Use `getSetting("AllowCommandsInSharedChat")` instead */
    getAllowCommandsInSharedChat() {
        return this.getSetting("AllowCommandsInSharedChat");
    }

    /** @deprecated Use `saveSetting("AllowCommandsInSharedChat", value)` instead */
    setAllowCommandsInSharedChat(value: boolean) {
        this.saveSetting("AllowCommandsInSharedChat", value);
    }
}

const settings = new SettingsManager();

frontendCommunicator.on("settings:get-all-setting-values", () => {
    return settings.settingsCache;
});

frontendCommunicator.on("settings:get-setting-value", (settingName: keyof FirebotSettingsTypes) => {
    return settings.getSetting(settingName);
});

frontendCommunicator.on("settings:save-setting-value", (settingName: keyof FirebotSettingsTypes, data: FirebotSettingsTypes[keyof FirebotSettingsTypes]) => {
    return settings.saveSetting(settingName, data);
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

export { settings as SettingsManager };
