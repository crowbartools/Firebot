import { EventEmitter } from "events";
import { JsonDB } from "node-json-db";
import fs from "fs";
import path from "path";
import logger from "../logwrapper";
import dataAccess from "./data-access";
import frontendCommunicator from "./frontend-communicator";
import {
    FirebotAutoUpdateLevel,
    FirebotGlobalSettings,
    FirebotSettingsDefaults,
    FirebotSettingsPaths,
    FirebotSettingsTypes
} from "../../types/settings";

class SettingsManager extends EventEmitter {
    settingsCache = {};

    constructor() {
        super();

        this.migrateUserSettingsToGlobal();

        frontendCommunicator.on("settings:get-setting-path", (settingName: keyof FirebotSettingsTypes) => {
            return this.getSettingPath(settingName);
        });

        frontendCommunicator.on("settings:get-setting", (settingName: keyof FirebotSettingsTypes) => {
            return this.getSetting(settingName);
        });

        frontendCommunicator.on("settings:save-setting", (request: { settingName: keyof FirebotSettingsTypes, data: FirebotSettingsTypes[keyof FirebotSettingsTypes] }) => {
            this.saveSetting(request.settingName, request.data);
        });

        frontendCommunicator.on("settings:delete-setting", (settingName: keyof FirebotSettingsTypes) => {
            this.deleteSetting(settingName);
        });

        frontendCommunicator.on("settings:flush-settings-cache", () => {
            this.flushSettingsCache();
        });
    }

    private getLoggedInProfilePath(suffix: string) {
        const loggedInProfile = this.getSetting("LoggedInProfile");
        return path.join("profiles", loggedInProfile, suffix);
    }

    private getSettingsFile(): JsonDB {
        return dataAccess.getJsonDbInUserData(this.getLoggedInProfilePath("settings"));
    }

    private getGlobalSettingsFile(): JsonDB {
        return dataAccess.getJsonDbInUserData("./global-settings");
    }

    private handleCorruptSettingsFile() {
        logger.warn("settings.json file appears to be corrupt. Resetting file...");

        const settingsPath = this.getLoggedInProfilePath("settings.json");
        fs.writeFileSync(settingsPath, JSON.stringify({
            settings: {
                firstTimeUse: false
            }
        }));
    }

    private migrateUserSettingsToGlobal() {
        // Iterate through all the global settings
        Object.keys(FirebotGlobalSettings).forEach((setting: keyof FirebotSettingsTypes) => {
            const settingPath = this.getSettingPath(setting);
            const userSettingExists = this.userSettingExists(settingPath);
            const globalSettingExists = this.globalSettingExists(settingPath);

            // If there IS a user value but NOT a global value,
            // save the user value to the global file and delete the user value
            if (userSettingExists && !globalSettingExists) {
                this.saveSetting(setting, this.getDataFromFile(settingPath, true));
                this.deleteUserDataAtPath(settingPath);
            }
        });
    }

    private userSettingExists(settingPath: string) {
        let success = false;

        try {
            success = this.getSettingsFile().getData(settingPath) != null;
        } catch { }

        return success;
    }

    private globalSettingExists(settingPath: string) {
        let success = false;

        try {
            success = this.getGlobalSettingsFile().getData(settingPath) != null;
        } catch { }

        return success;
    }

    private getDataFromFile(settingPath: string, forceCacheUpdate = false, defaultValue = undefined) {
        try {
            if (this.settingsCache[settingPath] == null || forceCacheUpdate) {
                const data = this.getSettingsFile().getData(settingPath);
                this.settingsCache[settingPath] = data ?? defaultValue;
            }
        } catch (err) {
            if (defaultValue !== undefined) {
                this.settingsCache[settingPath] = defaultValue;
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
        return this.settingsCache[settingPath];
    }

    private getDataFromGlobalSettingsFile(settingPath: string, forceCacheUpdate = false, defaultValue = undefined) {
        try {
            if (this.settingsCache[settingPath] == null || forceCacheUpdate) {
                const data = this.getGlobalSettingsFile().getData(settingPath);
                this.settingsCache[settingPath] = data ?? defaultValue;
            }
        } catch (err) {
            if (defaultValue !== undefined) {
                this.settingsCache[settingPath] = defaultValue;
            }
            if (err.name !== "DataError") {
                logger.warn(err);
            }
        }
        return this.settingsCache[settingPath];
    }

    private pushDataToFile(settingPath: string, data: unknown) {
        try {
            this.getSettingsFile().push(settingPath, data);
            this.settingsCache[settingPath] = data;
            frontendCommunicator.send("settings:setting-updated", { settingPath, data });
        } catch (err) {
            logger.debug(err.message);
        }
    }

    private pushDataToGlobalSettingsFile(settingPath: string, data: unknown) {
        try {
            this.getGlobalSettingsFile().push(settingPath, data);
            this.settingsCache[settingPath] = data;
            frontendCommunicator.send("settings:setting-updated", { settingPath, data });
        } catch (err) {
            logger.debug(err.message);
        }
    }

    private deleteUserDataAtPath(settingPath: string) {
        try {
            this.getSettingsFile().delete(settingPath);
            delete this.settingsCache[settingPath];
            frontendCommunicator.send("settings:setting-deleted", settingPath);
        } catch { }
    }

    private deleteGlobalDataAtPath(settingPath: string) {
        try {
            this.getGlobalSettingsFile().delete(settingPath);
            delete this.settingsCache[settingPath];
            frontendCommunicator.send("settings:setting-deleted", settingPath);
        } catch { }
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
        let value: FirebotSettingsTypes[SettingName];

        if (FirebotGlobalSettings[settingName] === true) {
            value = this.getDataFromGlobalSettingsFile(this.getSettingPath(settingName), forceCacheUpdate, FirebotSettingsDefaults[settingName]);
        } else {
            value = this.getDataFromFile(this.getSettingPath(settingName), forceCacheUpdate, FirebotSettingsDefaults[settingName]);
        }

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
        if (FirebotGlobalSettings[settingName] === true) {
            this.pushDataToGlobalSettingsFile(this.getSettingPath(settingName), data);
        } else {
            this.pushDataToFile(this.getSettingPath(settingName), data);
        }

        frontendCommunicator.send(`settings:setting-updated:${settingName}`, data);
        this.emit(`settings:setting-updated:${settingName}`, data);
    }

    /**
     * Delete a Firebot setting
     *
     * @param settingName Name of the setting to delete
     */
    deleteSetting<SettingName extends keyof FirebotSettingsTypes>(settingName: SettingName) {
        if (FirebotGlobalSettings[settingName] === true) {
            this.deleteGlobalDataAtPath(this.getSettingPath(settingName));
        } else {
            this.deleteUserDataAtPath(this.getSettingPath(settingName));
        }

        frontendCommunicator.send(`settings:setting-updated:${settingName}`, null);
        this.emit(`settings:setting-deleted:${settingName}`);
    }

    /**
     * Get a plugin setting or its default
     *
     * @param pluginName Name of the plugin
     * @param settingName Name of the setting
     * @param forceCacheUpdate Force an update to the settings cache. Defaults to `false`.
     * @param defaultValue The default value to return if one isn't explicitly defined
     * @returns The saved plugin setting value, or the default if it doesn't exist.
     */
    getPluginSetting(pluginName: string, settingName: string, forceCacheUpdate = false, defaultValue: unknown = undefined) {
        return this.getDataFromFile(`/plugins/${pluginName}/${settingName}`, forceCacheUpdate, defaultValue);
    }

    /**
     * Flushes the settings cache, forcing all settings to be retrieved from file on the next retrieval
     */
    flushSettingsCache() {
        this.settingsCache = {};
        frontendCommunicator.send("settings:settings-cache-flushed");
    }


    // Everything below this is deprecated. Leaving them for back compat with scripts.
    // You should use either getSetting or saveSetting with the relevant setting name.

    /** @deprecated Use `getSetting("EventSettings")` instead */
    getEventSettings = () => this.getSetting("EventSettings");

    /** @deprecated Use `getSetting("IgnoreSubsequentSubEventsAfterCommunitySub")` instead */
    ignoreSubsequentSubEventsAfterCommunitySub = () => this.getSetting("IgnoreSubsequentSubEventsAfterCommunitySub");

    /** @deprecated Use `getSetting("JustUpdated")` instead */
    hasJustUpdated = (): boolean => this.getSetting("JustUpdated");

    /** @deprecated Use `saveSetting("JustUpdated", value)` instead */
    setJustUpdated = (value: boolean) => this.saveSetting("JustUpdated", value);

    /** @deprecated Use `getSetting("CopiedOverlayVersion")` instead */
    getOverlayVersion = () => this.getSetting("CopiedOverlayVersion");

    /** @deprecated Use `saveSetting("CopiedOverlayVersion", value)` instead */
    setOverlayVersion = (value: string) => this.saveSetting("CopiedOverlayVersion", value);

    /** @deprecated Use `getSetting("ClearCustomScriptCache")` instead */
    getClearCustomScriptCache = () => this.getSetting("ClearCustomScriptCache");

    /** @deprecated Use `saveSetting("ClearCustomScriptCache", value)` instead */
    setClearCustomScriptCache = (value: boolean) => this.saveSetting("ClearCustomScriptCache", value);

    /** @deprecated Use `getSetting("RunCustomScripts")` instead */
    isCustomScriptsEnabled = () => this.getSetting("RunCustomScripts");

    /** @deprecated Use `getSetting("RunCustomScripts")` instead */
    getCustomScriptsEnabled = () => this.getSetting("RunCustomScripts");

    /** @deprecated Use `saveSetting("RunCustomScripts", value)` instead */
    setCustomScriptsEnabled = (value: boolean) => this.saveSetting("RunCustomScripts", value);

    /** @deprecated Use `getSetting("PersistCustomVariables")` instead */
    getPersistCustomVariables = () => this.getSetting("PersistCustomVariables");

    /** @deprecated Use `saveSetting("PersistCustomVariables", value)` instead */
    setPersistCustomVariables = (value: boolean) => this.saveSetting("PersistCustomVariables", value);

    /** @deprecated Use `getSetting("UseOverlayInstances")` instead */
    useOverlayInstances = (): boolean => this.getSetting("UseOverlayInstances");

    /** @deprecated Use `saveSetting("UseOverlayInstances", value)` instead */
    setUseOverlayInstances = (value: boolean) => this.saveSetting("UseOverlayInstances", value);

    /** @deprecated Use `getSetting("OverlayInstances")` instead */
    getOverlayInstances = () => this.getSetting("OverlayInstances");

    /** @deprecated Use `saveSetting("OverlayInstances", value)` instead */
    setOverlayInstances = (value: string[]) => this.saveSetting("OverlayInstances", value);

    /** @deprecated Use `getSetting("BackupKeepAll")` instead */
    backupKeepAll = () => this.getSetting("BackupKeepAll");

    /** @deprecated Use `getSetting("BackupOnExit")` instead */
    backupOnExit = () => this.getSetting("BackupOnExit");

    /** @deprecated Use `getSetting("BackupBeforeUpdates")` instead */
    backupBeforeUpdates = () => this.getSetting("BackupBeforeUpdates");

    /** @deprecated Use `getSetting("BackupOnceADay")` instead */
    backupOnceADay = () => this.getSetting("BackupOnceADay");

    /** @deprecated Use `saveSetting("BackupOnceADay", value)` instead */
    setBackupOnceADay = (value: boolean) => this.saveSetting("BackupOnceADay", value);

    /** @deprecated Use `getSetting("LastBackupDate")` instead */
    lastBackupDate = () => this.getSetting("LastBackupDate");

    /** @deprecated Use `saveSetting("LastBackupDate", value)` instead */
    setLastBackupDate = (value: Date) => this.saveSetting("LastBackupDate", value);

    /** @deprecated Use `getSetting("MaxBackupCount")` instead */
    maxBackupCount = () => this.getSetting("MaxBackupCount");

    /** @deprecated Use `getSetting("MaxBackupCount")` instead */
    setMaxBackupCount = (value: number) => this.saveSetting("MaxBackupCount", value);

    /** @deprecated Use `getSetting("AllowQuoteCSVDownloads")` instead */
    getAllowQuoteCSVDownloads = () => this.getSetting("AllowQuoteCSVDownloads");

    /** @deprecated Use `getSetting("ActiveChatUserListTimeout")` instead */
    getActiveChatUserListTimeout = () => this.getSetting("ActiveChatUserListTimeout");

    /** @deprecated Use `getSetting("WebServerPort")` instead */
    getWebSocketPort = () => this.getSetting("WebServerPort");

    /** @deprecated Use `getSetting("WebServerPort")` instead */
    getWebServerPort = () => this.getSetting("WebServerPort");

    /** @deprecated Use `getSetting("ViewerDB")` instead */
    getViewerDbStatus = () => this.getSetting("ViewerDB");

    /** @deprecated Use `getSetting("AutoUpdateLevel")` instead */
    getAutoUpdateLevel = (): FirebotAutoUpdateLevel => this.getSetting("AutoUpdateLevel");

    /** @deprecated Use `getSetting("AudioOutputDevice")` instead */
    getAudioOutputDevice = () => this.getSetting("AudioOutputDevice");

    /** @deprecated Use `getSetting("DebugMode")` instead */
    debugModeEnabled = (): boolean => this.getSetting("DebugMode");

    /** @deprecated Use `getSetting("WhileLoopEnabled")` instead */
    getWhileLoopEnabled = (): boolean => this.getSetting("WhileLoopEnabled");

    /** @deprecated Use `saveSetting("WhileLoopEnabled", value)` instead */
    setWhileLoopEnabled = (value: boolean) => this.saveSetting("WhileLoopEnabled", value);

    /** @deprecated Use `getSetting("SidebarControlledServices")` instead */
    getSidebarControlledServices = (): string[] => this.getSetting("SidebarControlledServices");

    /** @deprecated Use `getSetting("MinimizeToTray")` instead */
    getMinimizeToTray = () => this.getSetting("MinimizeToTray");

    /** @deprecated Use `saveSetting("MinimizeToTray", value)` instead */
    setMinimizeToTray = (value: boolean) => this.saveSetting("MinimizeToTray", value);
}

const settings = new SettingsManager();

export { settings as SettingsManager };