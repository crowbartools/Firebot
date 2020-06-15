"use strict";
const electron = require("electron");
const { app } = electron;

/**
 * Firebot's main window
 * Keeps a global reference of the window object, if you don't, the window will
 * be closed automatically when the JavaScript object is garbage collected.
 *
 *@type {Electron.BrowserWindow}
 */
let mainWindow;

function startApp() {

    const logger = require("./backend/logwrapper");
    logger.info("Starting Firebot...");

    const { settings } = require("./backend/common/settings-access");
    const { startBackup } = require("./backend/backupManager");

    // ensure only a single instance of the app runs
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        app.quit();
    } else {
        app.on('second-instance', () => {
            // Someone tried to run a second instance, we should focus our window.
            if (mainWindow) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.focus();
            }
        });
    }

    const { handleSquirrelEvents } = require("./backend/app-management/squirrel-events");
    if (!handleSquirrelEvents()) {
        // returns false if code execution should stop. App should be restarting at this point but
        // this ensures we dont try to continue
        return;
    }

    const { ensureRequiredFoldersExist } = require("./backend/app-management/data-tasks");
    ensureRequiredFoldersExist();

    app.on("window-all-closed", () => {
        // Unregister all shortcuts.
        let hotkeyManager = require("./backend/hotkeys/hotkey-manager");
        hotkeyManager.unregisterAllHotkeys();

        const chatModerationManager = require("./backend/chat/moderation/chat-moderation-manager");
        chatModerationManager.stopService();

        const userDatabase = require("./backend/database/userDatabase");
        userDatabase.setAllUsersOffline().then(() => {
            if (settings.backupOnExit()) {
                startBackup(false, app.quit);
            } else {
                app.quit();
            }
        });
    });

    app.on("will-quit", () => {
        const {
            handleProfileDeletion,
            handleProfileRename } = require("./backend/app-management/profile-tasks");
        handleProfileRename();
        handleProfileDeletion();
    });

    app.on("quit", () => {});

    app.whenReady().then(async () => {

        const { buildMainWindow, buildSplashScreen, setupWindowListeners } = require("./backend/app-management/window-creation");

        const splashScreen = buildSplashScreen();

        //load mixer auth
        require("./backend/auth/auth-manager");
        const mixerAuth = require("./backend/auth/mixer-auth");
        mixerAuth.registerMixerAuthProviders();

        // load accounts
        const accountAccess = require("./backend/common/account-access");
        await accountAccess.updateAccountCache(false);

        const connectionManager = require("./backend/common/connection-manager");
        connectionManager.startOnlineCheckInterval();

        const timerManager = require("./backend/timers/timer-manager");
        timerManager.startTimers();

        const mixerClient = require("./backend/mixer-api/client");
        mixerClient.initClients();

        // load effects
        const { loadEffects } = require("./backend/effects/builtInEffectLoader");
        loadEffects();

        // load commands
        const { loadCommands } = require("./backend/chat/commands/systemCommandLoader");
        loadCommands();

        // load event sources
        const { loadEventSources } = require("./backend/events/builtinEventSourceLoader");
        loadEventSources();

        // load event filters
        const { loadFilters } = require("./backend/events/filters/builtin-filter-loader");
        loadFilters();

        // load integrations
        const { loadIntegrations } = require("./backend/integrations/integrationLoader");
        loadIntegrations();

        // load variables
        const { loadReplaceVariables } = require("./backend/variables/builtin-variable-loader");
        loadReplaceVariables();

        // load restrictions
        const { loadRestrictions } = require("./backend/restrictions/builtin-restrictions-loader");
        loadRestrictions();

        const fontManager = require("./backend/fontManager");
        fontManager.generateAppFontCssFile();

        const mixplayProjectManager = require("./backend/interactive/mixplay-project-manager");
        mixplayProjectManager.loadProjects();

        const eventsAccess = require("./backend/events/events-access");
        eventsAccess.loadEventsAndGroups();

        const customRolesManager = require("./backend/roles/custom-roles-manager");
        customRolesManager.loadCustomRoles();

        const effectQueueManager = require("./backend/effects/queues/effect-queue-manager");
        effectQueueManager.loadEffectQueues();

        const chatModerationManager = require("./backend/chat/moderation/chat-moderation-manager");
        chatModerationManager.load();

        const countersManager = require("./backend/counters/counter-manager");
        countersManager.loadCounters();

        const gamesManager = require("./backend/games/game-manager");
        gamesManager.loadGameSettings();

        const builtinGameLoader = require("./backend/games/builtin-game-loader");
        builtinGameLoader.loadGames();

        // get importer in memory
        const v4Importer = require("./backend/import/v4/v4-importer");
        v4Importer.setupListeners();

        const { setupCommonListeners } = require("./backend/common/common-listeners");
        setupCommonListeners();

        const hotkeyManager = require("./backend/hotkeys/hotkey-manager");
        hotkeyManager.refreshHotkeyCache();

        const currencyManager = require("./backend/currency/currencyManager");
        currencyManager.startTimer();

        // Connect to DBs.
        logger.info("Creating or connecting user database");
        const userdb = require("./backend/database/userDatabase");
        userdb.connectUserDatabase();

        logger.info("Creating or connecting stats database");
        const statsdb = require("./backend/database/statsDatabase");
        statsdb.connectStatsDatabase();

        logger.info("Creating or connecting quotes database");
        const quotesdb = require("./backend/quotes/quotes-manager");
        quotesdb.loadQuoteDatabase();

        //load patronage data
        const patronageManager = require("./backend/patronageManager");
        patronageManager.loadPatronageData();

        mainWindow = buildMainWindow();
        global.renderWindow = mainWindow;

        setupWindowListeners(mainWindow, splashScreen);

        logger.on("logging", (transport, level, msg, meta) => {
            if (renderWindow != null && !renderWindow.isDestroyed()) {
                renderWindow.webContents.send("logging", {
                    transport: transport,
                    level: level,
                    msg: msg,
                    meta: meta
                });
            }
        });
    });
}

startApp();
