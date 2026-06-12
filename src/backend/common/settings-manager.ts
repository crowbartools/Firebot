import { TypedEmitter } from "tiny-typed-emitter";
import { JsonDB } from "node-json-db";
import fs from "fs";
import path from "path";

import type { FirebotAutoUpdateLevel, FirebotSettingsTypes } from "../../types";

import * as dataAccess from "./data-access";
import frontendCommunicator from "./frontend-communicator";
import { LoggerCache } from "../logger-cache";

const FirebotGlobalSettings: Partial<Record<keyof FirebotSettingsTypes, boolean>> = {
    ActiveProfiles: true,
    BackupBeforeUpdates: true,
    BackupIgnoreResources: true,
    BackupKeepAll: true,
    BackupLocation: true,
    BackupLocationReset: true,
    BackupOnceADay: true,
    BackupOnExit: true,
    DebugMode: true,
    DeleteProfile: true,
    LastBackupDate: true,
    LoggedInProfile: true,
    MaxBackupCount: true
};

const FirebotSettingsDefaults: FirebotSettingsTypes = {
    ActiveChatUserListTimeout: 5,
    ActiveProfiles: [],
    AllowChatCreatedCommandsToRunEffects: false,
    AllowCommandsInSharedChat: false,
    AllowQuoteCSVDownloads: true,
    AllowedActivityEvents: [
        "twitch:raid",
        "twitch:raid-sent-off",
        "twitch:follow",
        "twitch:sub",
        "twitch:subs-gifted",
        "twitch:community-subs-gifted",
        "twitch:cheer",
        "streamlabs:donation",
        "streamlabs:eldonation",
        'extralife:donation',
        "tipeeestream:donation",
        "streamelements:donation",
        "twitch:channel-reward-redemption"
    ],
    AudioOutputDevice: { label: "System Default", deviceId: "default" },
    AutoFlagBots: true,
    AutoUpdateLevel: 2,
    BackupBeforeUpdates: true,
    BackupIgnoreResources: true,
    BackupKeepAll: false,
    BackupLocation: undefined,
    BackupLocationReset: false,
    BackupOnceADay: true,
    BackupOnExit: true,
    ChatAlternateBackgrounds: true,
    ChatAvatars: true,
    ChatCompactMode: false,
    ChatCustomFontFamily: "Open Sans",
    ChatCustomFontFamilyEnabled: false,
    ChatCustomFontSize: 17,
    ChatCustomFontSizeEnabled: false,
    ChatGetAllEmotes: false,
    ChatHideBotAccountMessages: false,
    ChatHideDeletedMessages: false,
    ChatHideWhispers: false,
    ChatPronouns: true,
    ChatReverseOrder: false,
    ChatShowBttvEmotes: true,
    ChatShowFfzEmotes: true,
    ChatShowSevenTvEmotes: true,
    ChatShowSharedChatInfo: true,
    ChatTaggedNotificationSound: { name: "None" },
    ChatTaggedNotificationVolume: 5,
    ChatTimestamps: true,
    ClearChatFeedMode: "onlyStreamer",
    ConnectOnLaunch: false,
    ControlDeckEnabled: false,
    ControlDeckPin: undefined,
    ControlDeckOrientationMode: "dynamic",
    ControlDeckDefaultDeckId: null,
    CopiedOverlayVersion: "",
    DashboardLayout: {
        dashboardViewerList: "225px",
        dashboardChatWindow: "100%",
        dashboardActivityFeed: "275px"
    },
    DebugMode: false,
    DefaultEffectLabelsEnabled: true,
    DefaultModerationUser: "streamer",
    DefaultRewardTab: "powerups",
    DefaultToAdvancedCommandMode: false,
    DefaultTtsVoiceId: undefined,
    DeleteProfile: undefined,
    EventSetSettings: {},
    EventSettings: {},
    FirstTimeUse: true,
    ForceOverlayEffectsToContinueOnRefresh: true,
    GlobalValues: [],
    IgnoreSubsequentSubEventsAfterCommunitySub: true,
    JustUpdated: false,
    LegacySortTagsImported: false,
    LastBackupDate: undefined,
    LoggedInProfile: undefined,
    MaxBackupCount: 25,
    MigratedLegacyStartUpScriptsToPlugins: false,
    MinimizeToTray: false,
    NotifyOnBeta: false,
    OpenEffectQueueMonitorOnLaunch: false,
    OpenStreamPreviewOnLaunch: false,
    OverlayInstances: [],
    OverlayResolution: {
        width: 1280,
        height: 720
    },
    PersistCustomVariables: false,
    PresetRecursionLimit: true,
    QuickActions: {},
    RunCustomScripts: false,
    SeenAdvancedCommandModePopup: false,
    ShowActivityFeed: true,
    ShowActivityFeedEventsInChat: false,
    ShowAdBreakIndicator: true,
    ShowChatViewerList: true,
    ShowHypeTrainIndicator: true,
    ShowUptimeStat: true,
    ShowViewerCountStat: true,
    SidebarControlledServices: ["chat"],
    SidebarExpanded: true,
    SoundsEnabled: "On",
    StreamerExemptFromCooldowns: false,
    Theme: "Obsidian",
    TriggerUpcomingAdBreakMinutes: 0,
    TtsVoiceRate: 1,
    TtsVoiceVolume: 0.5,
    UseExperimentalTwitchClipUrlResolver: true,
    UseOverlayInstances: false,
    ViewerDB: true,
    ViewerListPageSize: 10,
    WebhookDebugLogs: false,
    WebOnlineCheckin: false,
    WebServerPort: 7472,
    WhileLoopEnabled: false,
    WysiwygBackground: "white"
};

/** Anything in `SettingsTypes` not listed here will resolve to "/settings/settingName" (e.g. "/settings/autoFlagBots") */
const FirebotSettingsPaths: Partial<Record<keyof FirebotSettingsTypes, string>> = {
    ActiveChatUserListTimeout: "/settings/activeChatUsers/inactiveTimer",
    ActiveProfiles: "/profiles/activeProfiles",
    ChatShowBttvEmotes: "/settings/chat/emotes/bttv",
    ChatShowFfzEmotes: "/settings/chat/emotes/ffz",
    ChatShowSevenTvEmotes: "/settings/chat/emotes/seventv",
    ChatTaggedNotificationSound: "/settings/chat/tagged/sound",
    ChatTaggedNotificationVolume: "/settings/chat/tagged/volume",
    ControlDeckEnabled: "/settings/controlDeck/enabled",
    ControlDeckPin: "/settings/controlDeck/pin",
    ControlDeckOrientationMode: "/settings/controlDeck/orientationMode",
    ControlDeckDefaultDeckId: "/settings/controlDeck/defaultDeckId",
    DashboardLayout: "/settings/dashboard/layout",
    DeleteProfile: "/profiles/deleteProfile",
    LoggedInProfile: "/profiles/loggedInProfile",
    ShowActivityFeed: "/settings/activityFeed",
    ShowChatViewerList: "/settings/chatUsersList",
    SoundsEnabled: "/settings/sounds",
    ViewerListPageSize: "/settings/viewerListDatabase/pageSize"
};

type Events = {
    [settingName in keyof FirebotSettingsTypes as `settings:setting-updated:${settingName}`]: (data: FirebotSettingsTypes[settingName]) => void;
} & {
    [settingName in keyof FirebotSettingsTypes as `settings:setting-deleted:${settingName}`]: () => void;
};

class SettingsManager extends TypedEmitter<Events> {
    private logger = LoggerCache.getLogger("Settings");
    settingsCache: Partial<Record<keyof FirebotSettingsTypes, unknown>> = {};

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
        this.logger.warn("settings.json file appears to be corrupt. Resetting file...");

        const settingsPath = path.join(dataAccess.getUserDataPath(), this.getLoggedInProfilePath("settings.json"));
        fs.writeFileSync(settingsPath, JSON.stringify({
            settings: {
                firstTimeUse: false
            }
        }));
    }

    private handleCorruptGlobalSettingsFile() {
        this.logger.warn("global-settings.json file appears to be corrupt. Resetting file...");

        const globalSettingsPath = path.join(dataAccess.getUserDataPath(), "global-settings.json");
        const profilesRoot = path.join(dataAccess.getUserDataPath(), "profiles");
        const profileDirs = fs.readdirSync(profilesRoot)
            .filter(f => fs.statSync(path.join(profilesRoot, f)).isDirectory());

        let loggedInProfile = profileDirs[0] ?? "";
        for (const dir of profileDirs) {
            const normalizedDir = dir.toLowerCase();
            if (normalizedDir === "main profile"
                || normalizedDir.startsWith("main")
            ) {
                loggedInProfile = dir;
                break;
            }
        }

        fs.writeFileSync(globalSettingsPath, JSON.stringify({
            profiles: {
                activeProfiles: profileDirs,
                loggedInProfile
            }
        }, null, 4));
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

    private getDataFromFile<T = unknown>(settingPath: string, forceCacheUpdate = false, defaultValue: T = undefined) {
        try {
            if (this.settingsCache[settingPath] == null || forceCacheUpdate) {
                const data = this.getSettingsFile().getData(settingPath) as T;
                this.settingsCache[settingPath] = data ?? defaultValue;
            }
        } catch (error) {
            const err = error as Error;
            if (defaultValue !== undefined) {
                this.settingsCache[settingPath] = defaultValue;
            }
            if (err.name !== "DataError") {
                this.logger.warn(err);
                if (
                    err.name === "DatabaseError" &&
                err["inner"] instanceof SyntaxError &&
                err["inner"].stack.includes("JSON.parse")
                ) {
                    this.handleCorruptSettingsFile();
                }
            }
        }
        return this.settingsCache[settingPath] as T;
    }

    private getDataFromGlobalSettingsFile<T = unknown>(settingPath: string, forceCacheUpdate = false, defaultValue: T = undefined) {
        try {
            if (this.settingsCache[settingPath] == null || forceCacheUpdate) {
                const data = this.getGlobalSettingsFile().getData(settingPath) as T;
                this.settingsCache[settingPath] = data ?? defaultValue;
            }
        } catch (err) {
            if (defaultValue !== undefined) {
                this.settingsCache[settingPath] = defaultValue;
            }
            if ((err as Error).name === "DatabaseError") {
                this.logger.error(`Failed to read "${settingPath}" in global settings file. File may be corrupt.`, err?.inner?.message ?? err.stack);
                this.handleCorruptGlobalSettingsFile();
            } else if ((err as Error).name !== "DataError") {
                this.logger.warn(err);
            }
        }
        return this.settingsCache[settingPath] as T;
    }

    private pushDataToFile(settingPath: string, data: unknown) {
        try {
            this.getSettingsFile().push(settingPath, data);
            this.settingsCache[settingPath] = data;
            frontendCommunicator.send("settings:setting-updated", { settingPath, data });
        } catch (err) {
            this.logger.debug((err as Error).message);
        }
    }

    private pushDataToGlobalSettingsFile(settingPath: string, data: unknown) {
        try {
            this.getGlobalSettingsFile().push(settingPath, data);
            this.settingsCache[settingPath] = data;
            frontendCommunicator.send("settings:setting-updated", { settingPath, data });
        } catch (err) {
            this.logger.debug((err as Error).message);
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
    getSettingPath(settingName: keyof FirebotSettingsTypes): string {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.emit(`settings:setting-updated:${settingName}` as any, data);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.emit(`settings:setting-deleted:${settingName}` as any);
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