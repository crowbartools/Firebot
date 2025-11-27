import { checkForFirebotSetupPathInArgs } from "../../file-open-helpers";
import frontendCommunicator from "../../../common/frontend-communicator";
import logger from "../../../logwrapper";

export async function whenReady() {

    logger.debug("...Applying IPC events");
    const { setupIpcEvents } = await import("./ipc-events");
    setupIpcEvents();

    logger.debug("...Checking for setup file");

    checkForFirebotSetupPathInArgs(process.argv);

    logger.debug("...Loading window management");
    const windowManagement = await import("../window-management");

    logger.debug("Showing splash screen...");
    await windowManagement.createSplashScreen();

    logger.debug("...Ensuring required folders exist");
    // Ensure required folders are created
    const { ensureRequiredFoldersExist } = await import("../../data-tasks");
    await ensureRequiredFoldersExist();

    // load twitch auth
    windowManagement.updateSplashScreenStatus("Loading Twitch login system...");
    await import("../../../auth/auth-manager");
    const { TwitchAuthProviders } = await import("../../../streaming-platforms/twitch/auth/twitch-auth");
    TwitchAuthProviders.registerTwitchAuthProviders();

    // load accounts
    windowManagement.updateSplashScreenStatus("Loading accounts...");

    const { AccountAccess } = await import("../../../common/account-access");
    AccountAccess.loadAccountData(false);

    const { FirebotDeviceAuthProvider } = await import("../../../auth/firebot-device-auth-provider");
    FirebotDeviceAuthProvider.setupDeviceAuthProvider();

    const connectionManager = (await import("../../../common/connection-manager")).default;

    windowManagement.updateSplashScreenStatus("Loading timers...");
    const { TimerManager } = await import("../../../timers/timer-manager");
    TimerManager.loadItems();
    TimerManager.startTimers();

    windowManagement.updateSplashScreenStatus("Loading scheduled effect lists...");
    const { ScheduledTaskManager } = await import("../../../timers/scheduled-task-manager");
    ScheduledTaskManager.loadItems();
    ScheduledTaskManager.start();

    windowManagement.updateSplashScreenStatus("Refreshing Twitch account data...");

    // Loading these first so that the refresh caches the account avatar URLs
    const _chatHelpers = await import("../../../chat/chat-helpers");
    const _eventSubChatHelpers = await import("../../../streaming-platforms/twitch/api/eventsub/eventsub-chat-helpers");

    const { TwitchApi } = await import("../../../streaming-platforms/twitch/api");
    await TwitchApi.refreshAccounts();

    windowManagement.updateSplashScreenStatus("Starting stream status poll...");
    connectionManager.startOnlineCheckInterval();

    // load effects
    logger.debug("Loading effects...");
    windowManagement.updateSplashScreenStatus("Loading effects...");
    const { loadEffects } = await import("../../../effects/builtin-effect-loader");
    loadEffects();

    windowManagement.updateSplashScreenStatus("Loading currencies...");
    const currencyAccess = (await import("../../../currency/currency-access")).default;
    currencyAccess.loadCurrencies();

    windowManagement.updateSplashScreenStatus("Loading ranks...");
    const viewerRanksManager = (await import("../../../ranks/rank-manager")).default;
    viewerRanksManager.loadItems();

    // load commands
    logger.debug("Loading sys commands...");
    windowManagement.updateSplashScreenStatus("Loading system commands...");
    const { loadSystemCommands } = await import("../../../chat/commands/system-command-loader");
    loadSystemCommands();

    // load event sources
    logger.debug("Loading event sources...");
    windowManagement.updateSplashScreenStatus("Loading event sources...");
    const { loadEventSources } = await import("../../../events/builtin-event-source-loader");
    loadEventSources();

    // load event filters
    logger.debug("Loading event filters...");
    windowManagement.updateSplashScreenStatus("Loading filters...");
    const { loadFilters } = await import("../../../events/filters/builtin-filter-loader");
    loadFilters();

    // load integrations
    logger.debug("Loading integrations...");
    windowManagement.updateSplashScreenStatus("Loading integrations...");
    const { loadIntegrations } = await import("../../../integrations/builtin-integration-loader");
    loadIntegrations();

    // load variables
    logger.debug("Loading variables...");
    windowManagement.updateSplashScreenStatus("Loading variables...");
    const { loadReplaceVariables } = await import("../../../variables/variable-loader");
    loadReplaceVariables();

    windowManagement.updateSplashScreenStatus("Loading variable macros...");
    const macroManager = (await import("../../../variables/macro-manager")).default;
    macroManager.loadItems();

    // load restrictions
    logger.debug("Loading restrictions...");
    windowManagement.updateSplashScreenStatus("Loading restrictions...");
    const { loadRestrictions } = await import("../../../restrictions/builtin-restrictions-loader");
    loadRestrictions();

    windowManagement.updateSplashScreenStatus("Loading fonts...");
    const { FontManager } = await import("../../../font-manager");
    await FontManager.loadInstalledFonts();

    windowManagement.updateSplashScreenStatus("Loading events...");
    const { EventsAccess } = await import("../../../events/events-access");
    EventsAccess.loadEventsAndGroups();

    windowManagement.updateSplashScreenStatus("Loading team roles...");
    const teamRolesManager = (await import("../../../roles/team-roles-manager")).default;
    await teamRolesManager.loadTeamRoles();

    windowManagement.updateSplashScreenStatus("Loading custom roles...");
    const customRolesManager = (await import("../../../roles/custom-roles-manager")).default;
    await customRolesManager.loadCustomRoles();

    const chatRolesManager = (await import("../../../roles/chat-roles-manager")).default;
    chatRolesManager.setupListeners();

    windowManagement.updateSplashScreenStatus("Loading known bot list...");
    await chatRolesManager.cacheViewerListBots();

    const twitchRolesManager = (await import("../../../roles/twitch-roles-manager")).default;
    twitchRolesManager.setupListeners();

    windowManagement.updateSplashScreenStatus("Loading channel moderators...");
    await twitchRolesManager.loadModerators();

    windowManagement.updateSplashScreenStatus("Loading channel VIPs...");
    await twitchRolesManager.loadVips();

    windowManagement.updateSplashScreenStatus("Loading channel subscribers...");
    await twitchRolesManager.loadSubscribers();

    windowManagement.updateSplashScreenStatus("Loading effect queues...");
    const { EffectQueueConfigManager } = await import("../../../effects/queues/effect-queue-config-manager");
    EffectQueueConfigManager.loadItems();

    windowManagement.updateSplashScreenStatus("Loading preset effect lists...");
    const { PresetEffectListManager } = await import("../../../effects/preset-lists/preset-effect-list-manager");
    PresetEffectListManager.loadItems();

    windowManagement.updateSplashScreenStatus("Loading quick actions...");
    const { QuickActionManager } = await import("../../../quick-actions/quick-action-manager");
    QuickActionManager.loadItems();

    windowManagement.updateSplashScreenStatus("Loading webhooks...");
    const webhookConfigManager = (await import("../../../webhooks/webhook-config-manager")).default;
    webhookConfigManager.loadItems();

    windowManagement.updateSplashScreenStatus("Loading overlay widgets...");
    const { loadWidgetTypes } = await import("../../../overlay-widgets/builtin-widget-type-loader");
    loadWidgetTypes();

    const overlayWidgetConfigManager = (await import("../../../overlay-widgets/overlay-widget-config-manager")).default;
    overlayWidgetConfigManager.loadItems();

    // windowManagement.updateSplashScreenStatus("Loading startup script data...");
    // const startupScriptsManager = await import("../../../common/handlers/custom-scripts/startup-scripts-manager");
    // startupScriptsManager.loadStartupConfig();

    windowManagement.updateSplashScreenStatus("Loading plugins...");
    const { PluginConfigManager } = await import("../../../custom-scripts/plugin-config-manager");
    PluginConfigManager.loadItems();

    windowManagement.updateSplashScreenStatus("Starting chat moderation manager...");
    const { ChatModerationManager } = await import("../../../chat/moderation/chat-moderation-manager");
    ChatModerationManager.load();

    windowManagement.updateSplashScreenStatus("Loading counters...");
    const { CounterManager } = await import("../../../counters/counter-manager");
    CounterManager.loadItems();

    windowManagement.updateSplashScreenStatus("Loading games...");
    const { GameManager } = await import("../../../games/game-manager");
    GameManager.loadGameSettings();

    const builtinGameLoader = await import("../../../games/builtin-game-loader");
    builtinGameLoader.loadGames();

    windowManagement.updateSplashScreenStatus("Loading custom variables...");
    const { CustomVariableManager } = await import("../../../common/custom-variable-manager");
    CustomVariableManager.loadVariablesFromFile();

    windowManagement.updateSplashScreenStatus("Loading sort tags...");
    const { SortTagManager } = await import("../../../sort-tags/sort-tag-manager");
    SortTagManager.loadSortTags();

    // get importer in memory
    windowManagement.updateSplashScreenStatus("Loading importers...");

    const { SetupManager } = await import("../../../setups/setup-manager");
    SetupManager.setupListeners();

    const { ImportManager } = await import("../../../import/import-manager");
    ImportManager.registerDefaultImporters();

    const { ViewerExportManager } = await import("../../../viewers/viewer-export-manager");
    ViewerExportManager.setupListeners();

    const { setupCommonListeners } = await import("../../../common/common-listeners");
    setupCommonListeners();

    windowManagement.updateSplashScreenStatus("Loading hotkeys...");
    const { HotkeyManager } = await import("../../../hotkeys/hotkey-manager");
    HotkeyManager.loadItems();

    windowManagement.updateSplashScreenStatus("Starting currency timer...");
    const currencyManager = (await import("../../../currency/currency-manager")).default;
    currencyManager.startTimer();

    // Connect to DBs.
    windowManagement.updateSplashScreenStatus("Loading viewers...");
    logger.info("Creating or connecting user database");
    const viewerDatabase = (await import("../../../viewers/viewer-database")).default;
    await viewerDatabase.connectViewerDatabase();

    // Set users in user db to offline if for some reason they are still set to online. (app crash or something)
    const viewerOnlineStatusManager = (await import("../../../viewers/viewer-online-status-manager")).default;
    await viewerOnlineStatusManager.setAllViewersOffline();

    windowManagement.updateSplashScreenStatus("Loading quotes...");
    logger.info("Creating or connecting quotes database");
    const { QuoteManager } = await import("../../../quotes/quote-manager");
    await QuoteManager.loadQuoteDatabase();

    // These are defined globally for Custom Scripts.
    // We will probably want to handle these differently but we shouldn't
    // change anything until we are ready as changing this will break most scripts
    const Effect = await import("../../../common/EffectType");
    global.EffectType = Effect.EffectTypeV5Map;
    const { ProfileManager } = await import("../../../common/profile-manager");
    global.SCRIPTS_DIR = ProfileManager.getPathInProfile("/scripts/");

    windowManagement.updateSplashScreenStatus("Running daily backup...");
    const { BackupManager } = await import("../../../backup-manager");
    await BackupManager.onceADayBackUpCheck();

    // start the REST api server
    windowManagement.updateSplashScreenStatus("Starting internal web server...");
    const httpServerManager = (await import("../../../../server/http-server-manager")).default;
    httpServerManager.start();

    // register websocket event handlers
    const websocketEventsHandler = await import("../../../../server/websocket-events-handler");
    websocketEventsHandler.createComponentEventListeners();

    windowManagement.updateSplashScreenStatus("Loading channel rewards...");
    const channelRewardManager = (await import("../../../channel-rewards/channel-reward-manager")).default;
    await channelRewardManager.loadChannelRewards();

    // load activity feed manager
    await import("../../../events/activity-feed-manager");

    const { IconManager } = await import("../../../common/icon-manager");
    await IconManager.loadFontAwesomeIcons();

    windowManagement.updateSplashScreenStatus("Starting stream info poll...");
    const streamInfoPoll = (await import("../../../streaming-platforms/twitch/stream-info-manager")).default;
    streamInfoPoll.startStreamInfoPoll();

    windowManagement.updateSplashScreenStatus("Starting notification manager...");
    const { NotificationManager } = await import("../../../notifications/notification-manager");
    NotificationManager.loadNotificationCache();

    // get ui extension manager in memory
    await import("../../../ui-extensions/ui-extension-manager");

    // start crowbar relay websocket
    await import("../../../crowbar-relay/crowbar-relay-websocket");

    const countdownManager = (await import("../../../overlay-widgets/builtin-types/countdown/countdown-manager")).default;
    countdownManager.startTimer();

    logger.debug("...loading main window");
    windowManagement.updateSplashScreenStatus("Here we go!");
    await windowManagement.createMainWindow();

    // Receive log messages from frontend
    frontendCommunicator.on("logging", (data: {
        level: string;
        message: string;
        meta?: unknown[];
    }) => {
        logger.log(data.level, data.message, ...(data.meta ?? []));
    });
};