"use strict";

exports.whenReady = async () => {
    const logger = require("../../../logwrapper");

    const windowManagement = require("../window-management");

    logger.debug("Showing splash screen...");
    await windowManagement.createSplashScreen();

    // Ensure required folders are created
    const { ensureRequiredFoldersExist } = require("../../data-tasks");
    ensureRequiredFoldersExist();

    //load mixer auth
    require("../../../auth/auth-manager");
    const mixerAuth = require("../../../auth/mixer-auth");
    mixerAuth.registerMixerAuthProviders();

    // load accounts
    const accountAccess = require("../../../common/account-access");
    await accountAccess.updateAccountCache(false);

    const connectionManager = require("../../../common/connection-manager");
    connectionManager.startOnlineCheckInterval();

    const timerManager = require("../../../timers/timer-manager");
    timerManager.startTimers();

    const mixerClient = require("../../../mixer-api/client");
    mixerClient.initClients();

    // load effects
    const { loadEffects } = require("../../../effects/builtInEffectLoader");
    loadEffects();

    // load commands
    const { loadCommands } = require("../../../chat/commands/systemCommandLoader");
    loadCommands();

    // load event sources
    const { loadEventSources } = require("../../../events/builtinEventSourceLoader");
    loadEventSources();

    // load event filters
    const { loadFilters } = require("../../../events/filters/builtin-filter-loader");
    loadFilters();

    // load integrations
    const { loadIntegrations } = require("../../../integrations/integrationLoader");
    loadIntegrations();

    // load variables
    const { loadReplaceVariables } = require("../../../variables/builtin-variable-loader");
    loadReplaceVariables();

    // load restrictions
    const { loadRestrictions } = require("../../../restrictions/builtin-restrictions-loader");
    loadRestrictions();

    const fontManager = require("../../../fontManager");
    fontManager.generateAppFontCssFile();

    const mixplayProjectManager = require("../../../interactive/mixplay-project-manager");
    mixplayProjectManager.loadProjects();

    const eventsAccess = require("../../../events/events-access");
    eventsAccess.loadEventsAndGroups();

    const customRolesManager = require("../../../roles/custom-roles-manager");
    customRolesManager.loadCustomRoles();

    const effectQueueManager = require("../../../effects/queues/effect-queue-manager");
    effectQueueManager.loadEffectQueues();

    const chatModerationManager = require("../../../chat/moderation/chat-moderation-manager");
    chatModerationManager.load();

    const countersManager = require("../../../counters/counter-manager");
    countersManager.loadCounters();

    const gamesManager = require("../../../games/game-manager");
    gamesManager.loadGameSettings();

    const builtinGameLoader = require("../../../games/builtin-game-loader");
    builtinGameLoader.loadGames();

    // get importer in memory
    const v4Importer = require("../../../import/v4/v4-importer");
    v4Importer.setupListeners();

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

    //load patronage data
    const patronageManager = require("../../../patronageManager");
    patronageManager.loadPatronageData();

    // These are defined globally for Custom Scripts.
    // We will probably wnat to handle these differently but we shouldn't
    // change anything until we are ready as changing this will break most scripts
    const Effect = require("../../../common/EffectType");
    global.EffectType = Effect.EffectTypeV5Map;
    const profileManager = require("../../../common/profile-manager");
    global.SCRIPTS_DIR = profileManager.getPathInProfile("/scripts/");

    const backupManager = require("../../../backupManager");
    backupManager.onceADayBackUpCheck();

    //start the REST api server
    const webServer = require("../../../../server/httpServer");
    webServer.start();

    windowManagement.createMainWindow();

    // forward backend logs to front end
    logger.on("logging", (transport, level, msg, meta) => {
        const mainWindow = windowManagement.mainWindow;
        if (mainWindow != null && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("logging", {
                transport: transport,
                level: level,
                msg: msg,
                meta: meta
            });
        }
    });
};