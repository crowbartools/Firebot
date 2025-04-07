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
    ActiveProfiles: string[];
    AllowCommandsInSharedChat: boolean;
    AllowQuoteCSVDownloads: boolean;
    AllowedActivityEvents: string[];
    AudioOutputDevice: FirebotAudioDevice;
    AutoFlagBots: boolean;
    AutoUpdateLevel: FirebotAutoUpdateLevel;
    BackupBeforeUpdates: boolean;
    BackupIgnoreResources: boolean;
    BackupKeepAll: boolean;
    BackupLocation: string;
    BackupOnceADay: boolean;
    BackupOnExit: boolean;
    ChatAlternateBackgrounds: boolean;
    ChatAvatars: boolean;
    ChatCompactMode: boolean;
    ChatCustomFontFamily: string;
    ChatCustomFontFamilyEnabled: boolean;
    ChatCustomFontSize: number;
    ChatCustomFontSizeEnabled: boolean;
    ChatHideBotAccountMessages: boolean;
    ChatHideDeletedMessages: boolean;
    ChatHideWhispers: boolean;
    ChatPronouns: boolean;
    ChatShowBttvEmotes: boolean;
    ChatShowFfzEmotes: boolean;
    ChatShowSevenTvEmotes: boolean;
    ChatTaggedNotificationSound: { name: string, path?: string | undefined };
    ChatTaggedNotificationVolume: number;
    ChatTimestamps: boolean;
    ClearChatFeedMode: "never" | "onlyStreamer" | "always";
    ClearCustomScriptCache: boolean;
    CopiedOverlayVersion: string;
    DashboardLayout: object; //TODO
    DebugMode: boolean;
    DefaultEffectLabelsEnabled: boolean;
    DefaultToAdvancedCommandMode: boolean;
    DefaultTtsVoiceId: string;
    DeleteProfile: string;
    EventSettings: object; //TODO
    FirstTimeUse: boolean;
    ForceOverlayEffectsToContinueOnRefresh: boolean;
    IgnoreSubsequentSubEventsAfterCommunitySub: boolean;
    JustUpdated: boolean;
    LastBackupDate: Date;
    LegacySortTagsImported: boolean;
    LoggedInProfile: string;
    MaxBackupCount: number | "All";
    MinimizeToTray: boolean;
    NotifyOnBeta: boolean;
    OpenStreamPreviewOnLaunch: boolean;
    OverlayInstances: string[];
    PersistCustomVariables: boolean;
    QuickActions: object; //TODO
    RunCustomScripts: boolean;
    SeenAdvancedCommandModePopup: boolean;
    ShowAdBreakIndicator: boolean;
    ShowActivityFeed: boolean;
    ShowChatViewerList: boolean;
    ShowHypeTrainIndicator: boolean;
    ShowUptimeStat: boolean;
    ShowViewerCountStat: boolean;
    SidebarControlledServices: string[];
    SidebarExpanded: boolean;
    SoundsEnabled: "On" | "Off";
    Theme: string;
    TriggerUpcomingAdBreakMinutes: number;
    TtsVoiceRate: number;
    TtsVoiceVolume: number;
    UseExperimentalTwitchClipUrlResolver: boolean;
    UseOverlayInstances: boolean;
    ViewerDB: boolean;
    ViewerListPageSize: number;
    WebOnlineCheckin: boolean;
    WebServerPort: number;
    WhileLoopEnabled: boolean;
    WysiwygBackground: "black" | "white";
}

export const FirebotGlobalSettings: Partial<Record<keyof FirebotSettingsTypes, boolean>> = {
    ActiveProfiles: true,
    BackupBeforeUpdates: true,
    BackupIgnoreResources: true,
    BackupKeepAll: true,
    BackupLocation: true,
    BackupOnceADay: true,
    BackupOnExit: true,
    DebugMode: true,
    DeleteProfile: true,
    LastBackupDate: true,
    LoggedInProfile: true,
    MaxBackupCount: true
};

export const FirebotSettingsDefaults: FirebotSettingsTypes = {
    ActiveChatUserListTimeout: 5,
    ActiveProfiles: [],
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
    AutoUpdateLevel: FirebotAutoUpdateLevel.Feature,
    BackupBeforeUpdates: true,
    BackupIgnoreResources: true,
    BackupKeepAll: false,
    BackupLocation: undefined,
    BackupOnceADay: true,
    BackupOnExit: true,
    ChatAlternateBackgrounds: true,
    ChatAvatars: true,
    ChatCompactMode: false,
    ChatCustomFontFamily: "Open Sans",
    ChatCustomFontFamilyEnabled: false,
    ChatCustomFontSize: 17,
    ChatCustomFontSizeEnabled: false,
    ChatHideBotAccountMessages: false,
    ChatHideDeletedMessages: false,
    ChatHideWhispers: false,
    ChatPronouns: true,
    ChatShowBttvEmotes: true,
    ChatShowFfzEmotes: true,
    ChatShowSevenTvEmotes: true,
    ChatTaggedNotificationSound: { name: "None" },
    ChatTaggedNotificationVolume: 5,
    ChatTimestamps: true,
    ClearChatFeedMode: "onlyStreamer",
    ClearCustomScriptCache: false,
    CopiedOverlayVersion: "",
    DashboardLayout: {},
    DebugMode: false,
    DefaultEffectLabelsEnabled: true,
    DefaultToAdvancedCommandMode: false,
    DefaultTtsVoiceId: undefined,
    DeleteProfile: undefined,
    EventSettings: {},
    FirstTimeUse: true,
    ForceOverlayEffectsToContinueOnRefresh: true,
    IgnoreSubsequentSubEventsAfterCommunitySub: true,
    JustUpdated: false,
    LegacySortTagsImported: false,
    LastBackupDate: undefined,
    LoggedInProfile: undefined,
    MaxBackupCount: 25,
    MinimizeToTray: false,
    NotifyOnBeta: false,
    OpenStreamPreviewOnLaunch: false,
    OverlayInstances: [],
    PersistCustomVariables: false,
    QuickActions: {},
    RunCustomScripts: false,
    SeenAdvancedCommandModePopup: false,
    ShowActivityFeed: true,
    ShowAdBreakIndicator: true,
    ShowChatViewerList: true,
    ShowHypeTrainIndicator: true,
    ShowUptimeStat: true,
    ShowViewerCountStat: true,
    SidebarControlledServices: ["chat"],
    SidebarExpanded: true,
    SoundsEnabled: "On",
    Theme: "Obsidian",
    TriggerUpcomingAdBreakMinutes: 0,
    TtsVoiceRate: 1,
    TtsVoiceVolume: 0.5,
    UseExperimentalTwitchClipUrlResolver: true,
    UseOverlayInstances: false,
    ViewerDB: true,
    ViewerListPageSize: 10,
    WebOnlineCheckin: false,
    WebServerPort: 7472,
    WhileLoopEnabled: false,
    WysiwygBackground: "white"
};

/** Anything in `SettingsTypes` not listed here will resolve to "/settings/settingName" (e.g. "/settings/autoFlagBots") */
export const FirebotSettingsPaths: Partial<Record<keyof FirebotSettingsTypes, string>> = {
    ActiveChatUserListTimeout: "/settings/activeChatUsers/inactiveTimer",
    ActiveProfiles: "/profiles/activeProfiles",
    ChatShowBttvEmotes: "/settings/chat/emotes/bttv",
    ChatShowFfzEmotes: "/settings/chat/emotes/ffz",
    ChatShowSevenTvEmotes: "/settings/chat/emotes/seventv",
    ChatTaggedNotificationSound: "/settings/chat/tagged/sound",
    ChatTaggedNotificationVolume: "/settings/chat/tagged/volume",
    DashboardLayout: "/settings/dashboard/layout",
    DeleteProfile: "/profiles/deleteProfile",
    LoggedInProfile: "/profiles/loggedInProfile",
    ShowActivityFeed: "/settings/activityFeed",
    ShowChatViewerList: "/settings/chatUsersList",
    SoundsEnabled: "/settings/sounds",
    ViewerListPageSize: "/settings/viewerListDatabase/pageSize"
};