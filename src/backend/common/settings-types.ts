export enum FirebotAutoUpdateLevel {
    Off = 0,
    Bugfix = 1,
    Feature = 2,
    MajorRelease = 3,
    Betas = 4,
}

export type FirebotAudioDevice = {
    label: string;
    deviceId: string;
}

export type FirebotSettingsTypes = {
    ActiveChatUserListTimeout: number;
    AllowCommandsInSharedChat: boolean;
    AllowQuoteCSVDownloads: boolean;
    AudioOutputDevice: FirebotAudioDevice;
    AutoFlagBots: boolean;
    AutoUpdateLevel: FirebotAutoUpdateLevel;
    BackupBeforeUpdates: boolean;
    BackupIgnoreResources: boolean;
    BackupKeepAll: boolean;
    BackupLocation: string;
    BackupOnceADay: boolean;
    BackupOnExit: boolean;
    ClearCustomScriptCache: boolean;
    CopiedOverlayVersion: string;
    DebugMode: boolean;
    EventSettings: object; //TODO
    ForceOverlayEffectsToContinueOnRefresh: boolean;
    IgnoreSubsequentSubEventsAfterCommunitySub: boolean;
    JustUpdated: boolean;
    LastBackupDate: Date;
    MaxBackupCount: number | "All";
    MinimizeToTray: boolean;
    OpenStreamPreviewOnLaunch: boolean;
    OverlayInstances: string[];
    PersistCustomVariables: boolean;
    QuickActions: object; //TODO
    RunCustomScripts: boolean;
    SidebarControlledServices: string[];
    TriggerUpcomingAdBreakMinutes: number;
    UseOverlayInstances: boolean;
    ViewerDB: boolean;
    WebOnlineCheckin: boolean;
    WebServerPort: number;
    WebsocketPort: number;
    WhileLoopEnabled: boolean;
}

export const FirebotSettingsDefaults: FirebotSettingsTypes = {
    ActiveChatUserListTimeout: 5,
    AllowCommandsInSharedChat: false,
    AllowQuoteCSVDownloads: true,
    AudioOutputDevice: { label: "System Default", deviceId: "default" },
    AutoFlagBots: true,
    AutoUpdateLevel: FirebotAutoUpdateLevel.Feature,
    BackupBeforeUpdates: true,
    BackupIgnoreResources: true,
    BackupKeepAll: false,
    BackupLocation: undefined,
    BackupOnceADay: true,
    BackupOnExit: true,
    ClearCustomScriptCache: false,
    CopiedOverlayVersion: "",
    DebugMode: false,
    EventSettings: {},
    ForceOverlayEffectsToContinueOnRefresh: true,
    IgnoreSubsequentSubEventsAfterCommunitySub: true,
    JustUpdated: false,
    LastBackupDate: null,
    MaxBackupCount: 25,
    MinimizeToTray: false,
    OpenStreamPreviewOnLaunch: false,
    OverlayInstances: [],
    PersistCustomVariables: false,
    QuickActions: {},
    RunCustomScripts: false,
    SidebarControlledServices: ["chat"],
    TriggerUpcomingAdBreakMinutes: 0,
    UseOverlayInstances: false,
    ViewerDB: true,
    WebOnlineCheckin: false,
    WebServerPort: 7472,
    WebsocketPort: 8080,
    WhileLoopEnabled: false
};

/** Anything in `SettingsTypes` not listed here will resolve to "/settings/settingName" (e.g. "/settings/autoFlagBots") */
export const FirebotSettingsPaths: Partial<Record<keyof FirebotSettingsTypes, string>> = {
    ActiveChatUserListTimeout: "/settings/activeChatUsers/inactiveTimer"
};