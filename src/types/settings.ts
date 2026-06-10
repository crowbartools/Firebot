export enum FirebotAutoUpdateLevel {
    Off = 0,
    Bugfix = 1,
    Feature = 2,
    MajorRelease = 3,
    Betas = 4
}

export type FirebotAudioDevice = {
    label: string;
    deviceId: string;
};

export type FirebotGlobalValue = {
    name: string;
    secret?: boolean;
    value: string;
};

export type FirebotSettingsTypes = {
    ActiveChatUserListTimeout: number;
    ActiveProfiles: string[];
    AllowChatCreatedCommandsToRunEffects: boolean;
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
    BackupLocationReset: boolean;
    BackupOnceADay: boolean;
    BackupOnExit: boolean;
    ChatAlternateBackgrounds: boolean;
    ChatAvatars: boolean;
    ChatCompactMode: boolean;
    ChatCustomFontFamily: string;
    ChatCustomFontFamilyEnabled: boolean;
    ChatCustomFontSize: number;
    ChatCustomFontSizeEnabled: boolean;
    ChatGetAllEmotes: boolean;
    ChatHideBotAccountMessages: boolean;
    ChatHideDeletedMessages: boolean;
    ChatHideWhispers: boolean;
    ChatPronouns: boolean;
    ChatReverseOrder: boolean;
    ChatShowBttvEmotes: boolean;
    ChatShowFfzEmotes: boolean;
    ChatShowSevenTvEmotes: boolean;
    ChatShowSharedChatInfo: boolean;
    ChatTaggedNotificationSound: { name: string, path?: string | undefined };
    ChatTaggedNotificationVolume: number;
    ChatTimestamps: boolean;
    ClearChatFeedMode: "never" | "onlyStreamer" | "always";
    ClearCustomScriptCache: boolean;
    ConnectOnLaunch: boolean;
    ControlDeckEnabled: boolean;
    ControlDeckPin?: string;
    ControlDeckOrientationMode: "dynamic" | "fixed";
    ControlDeckDefaultDeckId?: string | null;
    CopiedOverlayVersion: string;
    DashboardLayout: {
        dashboardViewerList: string;
        dashboardChatWindow: string;
        dashboardActivityFeed: string;
    };
    DebugMode: boolean;
    DefaultEffectLabelsEnabled: boolean;
    DefaultModerationUser: "streamer" | "bot";
    DefaultRewardTab: "powerups" | "rewards" | "queue";
    DefaultToAdvancedCommandMode: boolean;
    DefaultTtsVoiceId: string;
    DeleteProfile: string;
    EventSetSettings: Record<string, {
        position: number;
    }>;
    EventSettings: object; // Pretty sure this is no longer used
    FirstTimeUse: boolean;
    ForceOverlayEffectsToContinueOnRefresh: boolean;
    GlobalValues: Array<FirebotGlobalValue>;
    IgnoreSubsequentSubEventsAfterCommunitySub: boolean;
    JustUpdated: boolean;
    LastBackupDate: Date;
    LegacySortTagsImported: boolean;
    LoggedInProfile: string;
    MaxBackupCount: number | "All";
    MigratedLegacyStartUpScriptsToPlugins: boolean;
    MinimizeToTray: boolean;
    NotifyOnBeta: boolean;
    OpenEffectQueueMonitorOnLaunch: boolean;
    OpenStreamPreviewOnLaunch: boolean;
    OverlayResolution: {
        width: number;
        height: number;
    };
    OverlayInstances: string[];
    PersistCustomVariables: boolean;
    PresetRecursionLimit: boolean;
    QuickActions: Record<string, {
        enabled: boolean;
        position: number;
    }>;
    RunCustomScripts: boolean;
    SeenAdvancedCommandModePopup: boolean;
    ShowAdBreakIndicator: boolean;
    ShowActivityFeed: boolean;
    ShowActivityFeedEventsInChat: boolean;
    ShowChatViewerList: boolean;
    ShowHypeTrainIndicator: boolean;
    ShowUptimeStat: boolean;
    ShowViewerCountStat: boolean;
    SidebarControlledServices: string[];
    SidebarExpanded: boolean;
    SoundsEnabled: "On" | "Off";
    StreamerExemptFromCooldowns: boolean;
    Theme: string;
    TriggerUpcomingAdBreakMinutes: number;
    TtsVoiceRate: number;
    TtsVoiceVolume: number;
    UseExperimentalTwitchClipUrlResolver: boolean;
    UseOverlayInstances: boolean;
    ViewerDB: boolean;
    ViewerListPageSize: number;
    WebhookDebugLogs: boolean;
    WebOnlineCheckin: boolean;
    WebServerPort: number;
    WhileLoopEnabled: boolean;
    WysiwygBackground: "black" | "white";
};