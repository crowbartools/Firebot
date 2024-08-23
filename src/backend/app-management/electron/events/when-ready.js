"use strict";


const {checkForFirebotSetupPathInArgs} = require("../../file-open-helpers");

exports.whenReady = async () => {
    const logger = require("../../../logwrapper");

    logger.debug('...Loading updater backend');
    const setupUpdater = require('../../../updater/updater');
    setupUpdater();

    logger.debug('...Applying IPC events');
    const setupIpcEvents = require('./ipc-events');
    setupIpcEvents();

    logger.debug("...Checking for setup file");

    checkForFirebotSetupPathInArgs(process.argv);

    logger.debug("...Loading window management");
    const windowManagement = require("../window-management");

    logger.debug("Showing splash screen...");
    await windowManagement.createSplashScreen();

    logger.debug("...Ensuring required folders exist");
    // Ensure required folders are created
    const { ensureRequiredFoldersExist } = require("../../data-tasks");
    ensureRequiredFoldersExist();

    // load twitch auth
    windowManagement.updateSplashScreenStatus("Loading Twitch login system...");
    require("../../../auth/auth-manager");
    const twitchAuth = require("../../../auth/twitch-auth");
    twitchAuth.registerTwitchAuthProviders();

    // load accounts
    windowManagement.updateSplashScreenStatus("Loading accounts...");
    const accountAccess = require("../../../common/account-access");
    await accountAccess.updateAccountCache(false);

    const firebotDeviceAuthProvider = require("../../../auth/firebot-device-auth-provider");
    firebotDeviceAuthProvider.setupDeviceAuthProvider();

    const connectionManager = require("../../../common/connection-manager");

    windowManagement.updateSplashScreenStatus("Loading timers...");
    const timerManager = require("../../../timers/timer-manager");
    await timerManager.loadItems();
    timerManager.startTimers();

    windowManagement.updateSplashScreenStatus("Loading scheduled effect lists...");
    const scheduledTaskManager = require("../../../timers/scheduled-task-manager");
    scheduledTaskManager.loadItems();
    scheduledTaskManager.start();

    windowManagement.updateSplashScreenStatus("Refreshing Twitch account data...");
    await accountAccess.refreshTwitchData();

    const twitchFrontendListeners = require("../../../twitch-api/frontend-twitch-listeners");
    twitchFrontendListeners.setupListeners();

    windowManagement.updateSplashScreenStatus("Starting stream status poll...");
    connectionManager.startOnlineCheckInterval();

    // load effects
    logger.debug("Loading effects...");
    windowManagement.updateSplashScreenStatus("Loading effects...");
    const { loadEffects } = require("../../../effects/builtin-effect-loader");
    loadEffects();

    windowManagement.updateSplashScreenStatus("Loading currencies...");
    const currencyAccess = require("../../../currency/currency-access").default;
    currencyAccess.refreshCurrencyCache();

    windowManagement.updateSplashScreenStatus("Loading ranks...");
    const viewerRanksManager = require("../../../ranks/rank-manager");
    viewerRanksManager.loadItems();

    // load commands
    logger.debug("Loading sys commands...");
    windowManagement.updateSplashScreenStatus("Loading system commands...");
    const { loadSystemCommands } = require("../../../chat/commands/system-command-loader");
    loadSystemCommands();

    // load event sources
    logger.debug("Loading event sources...");
    windowManagement.updateSplashScreenStatus("Loading event sources...");
    const { loadEventSources } = require("../../../events/builtin-event-source-loader");
    loadEventSources();

    // load event filters
    logger.debug("Loading event filters...");
    windowManagement.updateSplashScreenStatus("Loading filters...");
    const { loadFilters } = require("../../../events/filters/builtin-filter-loader");
    loadFilters();

    // load integrations
    logger.debug("Loading integrations...");
    windowManagement.updateSplashScreenStatus("Loading integrations...");
    const { loadIntegrations } = require("../../../integrations/builtin-integration-loader");
    loadIntegrations();

    // load variables
    logger.debug("Loading variables...");
    windowManagement.updateSplashScreenStatus("Loading variables...");
    const { loadReplaceVariables } = require("../../../variables/variable-loader");
    loadReplaceVariables();

    windowManagement.updateSplashScreenStatus("Loading variable macros...");
    const macroManager = require("../../../variables/macro-manager");
    macroManager.loadItems();

    // load restrictions
    logger.debug("Loading restrictions...");
    windowManagement.updateSplashScreenStatus("Loading restrictions...");
    const { loadRestrictions } = require("../../../restrictions/builtin-restrictions-loader");
    loadRestrictions();

    const fontManager = require("../../../fontManager");
    fontManager.generateAppFontCssFile();

    windowManagement.updateSplashScreenStatus("Loading events...");
    const eventsAccess = require("../../../events/events-access");
    eventsAccess.loadEventsAndGroups();

    windowManagement.updateSplashScreenStatus("Loading team roles...");
    const teamRolesManager = require("../../../roles/team-roles-manager");
    teamRolesManager.loadTeamRoles();

    windowManagement.updateSplashScreenStatus("Loading custom roles...");
    const customRolesManager = require("../../../roles/custom-roles-manager");
    await customRolesManager.loadCustomRoles();

    const chatRolesManager = require("../../../roles/chat-roles-manager");

    windowManagement.updateSplashScreenStatus("Loading known bot list...");
    await chatRolesManager.cacheViewerListBots();

    windowManagement.updateSplashScreenStatus("Loading channel moderators...");
    await chatRolesManager.loadModerators();

    windowManagement.updateSplashScreenStatus("Loading channel VIPs...");
    await chatRolesManager.loadVips();

    windowManagement.updateSplashScreenStatus("Loading effect queues...");
    const effectQueueManager = require("../../../effects/queues/effect-queue-manager");
    effectQueueManager.loadItems();

    windowManagement.updateSplashScreenStatus("Loading preset effect lists...");
    const presetEffectListManager = require("../../../effects/preset-lists/preset-effect-list-manager");
    presetEffectListManager.loadItems();

    windowManagement.updateSplashScreenStatus("Loading quick actions...");
    const quickActionManager = require("../../../quick-actions/quick-action-manager");
    quickActionManager.loadItems();

    windowManagement.updateSplashScreenStatus("Loading startup script data...");
    const startupScriptsManager = require("../../../common/handlers/custom-scripts/startup-scripts-manager");
    startupScriptsManager.loadStartupConfig();

    windowManagement.updateSplashScreenStatus("Starting chat moderation manager...");
    const chatModerationManager = require("../../../chat/moderation/chat-moderation-manager");
    chatModerationManager.load();

    windowManagement.updateSplashScreenStatus("Loading counters...");
    const countersManager = require("../../../counters/counter-manager");
    countersManager.loadItems();

    windowManagement.updateSplashScreenStatus("Loading games...");
    const gamesManager = require("../../../games/game-manager");
    gamesManager.loadGameSettings();

    const builtinGameLoader = require("../../../games/builtin-game-loader");
    builtinGameLoader.loadGames();

    windowManagement.updateSplashScreenStatus("Loading custom variables...");
    const {settings} = require("../../../common/settings-access");
    if (settings.getPersistCustomVariables()) {
        const customVariableManager = require("../../../common/custom-variable-manager");
        customVariableManager.loadVariablesFromFile();
    }

    // get importer in memory
    windowManagement.updateSplashScreenStatus("Loading importers...");
    const v4Importer = require("../../../import/v4/v4-importer");
    v4Importer.setupListeners();

    const setupImporter = require("../../../import/setups/setup-importer");
    setupImporter.setupListeners();

    const slcbImporter = require("../../../import/third-party/streamlabs-chatbot");
    slcbImporter.setupListeners();

    const { setupCommonListeners } = require("../../../common/common-listeners");
    setupCommonListeners();

    windowManagement.updateSplashScreenStatus("Loading hotkeys...");
    const hotkeyManager = require("../../../hotkeys/hotkey-manager");
    hotkeyManager.refreshHotkeyCache();

    windowManagement.updateSplashScreenStatus("Starting currency timer...");
    const currencyManager = require("../../../currency/currency-manager");
    currencyManager.startTimer();

    // Connect to DBs.
    windowManagement.updateSplashScreenStatus("Loading viewers...");
    logger.info("Creating or connecting user database");
    const viewerDatabase = require("../../../viewers/viewer-database");
    await viewerDatabase.connectViewerDatabase();

    // Set users in user db to offline if for some reason they are still set to online. (app crash or something)
    const viewerOnlineStatusManager = require("../../../viewers/viewer-online-status-manager");
    await viewerOnlineStatusManager.setAllViewersOffline();

    windowManagement.updateSplashScreenStatus("Loading stats...");
    logger.info("Creating or connecting stats database");
    const statsdb = require("../../../database/statsDatabase");
    statsdb.connectStatsDatabase();

    windowManagement.updateSplashScreenStatus("Loading quotes...");
    logger.info("Creating or connecting quotes database");
    const quotesdb = require("../../../quotes/quotes-manager");
    quotesdb.loadQuoteDatabase();

    // These are defined globally for Custom Scripts.
    // We will probably want to handle these differently but we shouldn't
    // change anything until we are ready as changing this will break most scripts
    const Effect = require("../../../common/EffectType");
    global.EffectType = Effect.EffectTypeV5Map;
    const profileManager = require("../../../common/profile-manager");
    global.SCRIPTS_DIR = profileManager.getPathInProfile("/scripts/");

    windowManagement.updateSplashScreenStatus("Running daily backup...");
    const backupManager = require("../../../backup-manager");
    await backupManager.onceADayBackUpCheck();

    // start the REST api server
    windowManagement.updateSplashScreenStatus("Starting internal web server...");
    const httpServerManager = require("../../../../server/http-server-manager");
    httpServerManager.start();

    // register websocket event handlers
    const websocketEventsHandler = require("../../../../server/websocket-events-handler");
    websocketEventsHandler.createComponentEventListeners();

    windowManagement.updateSplashScreenStatus("Loading channel rewards...");
    const channelRewardManager = require("../../../channel-rewards/channel-reward-manager");
    await channelRewardManager.loadChannelRewards();

    // load activity feed manager
    require("../../../events/activity-feed-manager");

    const iconManager = require("../../../common/icon-manager");
    iconManager.loadFontAwesomeIcons();

    windowManagement.updateSplashScreenStatus("Starting stream info poll...");
    const streamInfoPoll = require("../../../twitch-api/stream-info-manager");
    streamInfoPoll.startStreamInfoPoll();

    windowManagement.updateSplashScreenStatus("Starting notification manager...");
    const notificationManager = require("../../../notifications/notification-manager").default;
    await notificationManager.loadAllNotifications();
    notificationManager.startExternalNotificationCheck();

    logger.debug('...loading main window');
    windowManagement.updateSplashScreenStatus("Here we go!");
    await windowManagement.createMainWindow();

    // forward backend logs to front end
    logger.on("logging", (transport, level, msg, meta) => {
        const mainWindow = windowManagement.mainWindow;
        if (mainWindow != null && !mainWindow.isDestroyed() && mainWindow.webContents != null) {
            mainWindow.webContents.send("logging", {
                transport: transport ? { name: transport.name } : null,
                level: level,
                msg: msg,
                meta: meta
            });
        }
    });
};