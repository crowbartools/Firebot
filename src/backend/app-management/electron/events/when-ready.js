"use strict";

const {checkForFirebotSetupPath} = require("../../file-open-helpers");

exports.whenReady = async () => {
    const logger = require("../../../logwrapper");

    logger.debug("...Checking for setup file");

    checkForFirebotSetupPath(process.argv);

    logger.debug("...Loading window management");
    const windowManagement = require("../window-management");

    logger.debug("Showing splash screen...");
    await windowManagement.createSplashScreen();

    logger.debug("...Ensuring required folders exist");
    // Ensure required folders are created
    const { ensureRequiredFoldersExist } = require("../../data-tasks");
    ensureRequiredFoldersExist();

    // load twitch auth
    require("../../../auth/auth-manager");
    const twitchAuth = require("../../../auth/twitch-auth");
    twitchAuth.registerTwitchAuthProviders();

    // load accounts
    const accountAccess = require("../../../common/account-access");
    await accountAccess.updateAccountCache(false);

    const firebotStaticAuthProvider = require("../../../auth/firebot-static-auth-provider");
    firebotStaticAuthProvider.setupStaticAuthProvider();

    const connectionManager = require("../../../common/connection-manager");

    const timerManager = require("../../../timers/timer-manager");
    await timerManager.loadItems();
    timerManager.startTimers();

    const scheduledTaskManager = require("../../../timers/scheduled-task-manager");
    scheduledTaskManager.loadItems();
    scheduledTaskManager.start();

    await accountAccess.refreshTwitchData();

    const twitchFrontendListeners = require("../../../twitch-api/frontend-twitch-listeners");
    twitchFrontendListeners.setupListeners();

    connectionManager.startOnlineCheckInterval();

    // load effects
    logger.debug("Loading effects...");
    const { loadEffects } = require("../../../effects/builtin-effect-loader");
    loadEffects();

    // load commands
    logger.debug("Loading sys commands...");
    const { loadCommands } = require("../../../chat/commands/systemCommandLoader");
    loadCommands();

    // load event sources
    logger.debug("Loading event sources...");
    const { loadEventSources } = require("../../../events/builtinEventSourceLoader");
    loadEventSources();

    // load event filters
    logger.debug("Loading event filters...");
    const { loadFilters } = require("../../../events/filters/builtin-filter-loader");
    loadFilters();

    // load integrations
    logger.debug("Loading integrations...");
    const { loadIntegrations } = require("../../../integrations/builtin-integration-loader");
    loadIntegrations();

    // load variables
    logger.debug("Loading variables...");
    const { loadReplaceVariables } = require("../../../variables/builtin-variable-loader");
    loadReplaceVariables();

    // load restrictions
    logger.debug("Loading restrictions...");
    const { loadRestrictions } = require("../../../restrictions/builtin-restrictions-loader");
    loadRestrictions();

    const fontManager = require("../../../fontManager");
    fontManager.generateAppFontCssFile();

    const eventsAccess = require("../../../events/events-access");
    eventsAccess.loadEventsAndGroups();

    const teamRolesManager = require("../../../roles/team-roles-manager");
    teamRolesManager.loadTeamRoles();

    const customRolesManager = require("../../../roles/custom-roles-manager");
    customRolesManager.loadCustomRoles();

    const chatRolesManager = require("../../../roles/chat-roles-manager");
    chatRolesManager.cacheViewerListBots();

    const effectQueueManager = require("../../../effects/queues/effect-queue-manager");
    effectQueueManager.loadItems();

    const presetEffectListManager = require("../../../effects/preset-lists/preset-effect-list-manager");
    presetEffectListManager.loadItems();

    const quickActionManager = require("../../../quick-actions/quick-action-manager");
    quickActionManager.loadItems();

    const startupScriptsManager = require("../../../common/handlers/custom-scripts/startup-scripts-manager");
    startupScriptsManager.loadStartupConfig();

    const chatModerationManager = require("../../../chat/moderation/chat-moderation-manager");
    chatModerationManager.load();

    const countersManager = require("../../../counters/counter-manager");
    countersManager.loadItems();

    const gamesManager = require("../../../games/game-manager");
    gamesManager.loadGameSettings();

    const builtinGameLoader = require("../../../games/builtin-game-loader");
    builtinGameLoader.loadGames();

    const {settings} = require("../../../common/settings-access");
    if (settings.getPersistCustomVariables()) {
        const customVariableManager = require("../../../common/custom-variable-manager");
        customVariableManager.loadVariablesFromFile();
    }

    // get importer in memory
    const v4Importer = require("../../../import/v4/v4-importer");
    v4Importer.setupListeners();

    const setupImporter = require("../../../import/setups/setup-importer");
    setupImporter.setupListeners();

    const slcbImporter = require("../../../import/third-party/streamlabs-chatbot");
    slcbImporter.setupListeners();

    const { setupCommonListeners } = require("../../../common/common-listeners");
    setupCommonListeners();

    const hotkeyManager = require("../../../hotkeys/hotkey-manager");
    hotkeyManager.refreshHotkeyCache();

    const currencyManager = require("../../../currency/currencyManager");
    currencyManager.startTimer();

    // Connect to DBs.
    logger.info("Creating or connecting user database");
    const userdb = require("../../../database/userDatabase");
    userdb.connectUserDatabase();
    // Set users in user db to offline if for some reason they are still set to online. (app crash or something)
    userdb.setAllUsersOffline();

    logger.info("Creating or connecting stats database");
    const statsdb = require("../../../database/statsDatabase");
    statsdb.connectStatsDatabase();

    logger.info("Creating or connecting quotes database");
    const quotesdb = require("../../../quotes/quotes-manager");
    quotesdb.loadQuoteDatabase();

    // These are defined globally for Custom Scripts.
    // We will probably wnat to handle these differently but we shouldn't
    // change anything until we are ready as changing this will break most scripts
    const Effect = require("../../../common/EffectType");
    global.EffectType = Effect.EffectTypeV5Map;
    const profileManager = require("../../../common/profile-manager");
    global.SCRIPTS_DIR = profileManager.getPathInProfile("/scripts/");

    const backupManager = require("../../../backupManager");
    backupManager.onceADayBackUpCheck();

    // start the REST api server
    const httpServerManager = require("../../../../server/http-server-manager");
    httpServerManager.start();

    const channelRewardManager = require("../../../channel-rewards/channel-reward-manager");
    await channelRewardManager.loadChannelRewards();

    // load activity feed manager
    require("../../../events/activity-feed-manager");

    const iconManager = require("../../../common/icon-manager");
    iconManager.loadFontAwesomeIcons();

    const streamInfoPoll = require("../../../twitch-api/stream-info-poll");
    streamInfoPoll.startStreamInfoPoll();

    windowManagement.createMainWindow();

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