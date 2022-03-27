"use strict";

const electron = require("electron");
const { BrowserWindow, BrowserView, Menu, shell, dialog } = electron;
const path = require("path");
const url = require("url");
const windowStateKeeper = require("electron-window-state");
const fileOpenHelpers = require("../file-open-helpers");
const createTray = require('./tray-creation.js');
const logger = require("../../logwrapper");

/**
 * Firebot's main window
 * Keeps a global reference of the window object, if you don't, the window will
 * be closed automatically when the JavaScript object is garbage collected.
 *@type {Electron.BrowserWindow}
 */
exports.mainWindow = null;

/**
 * The splashscreen window.
 *@type {Electron.BrowserWindow}
 */
let splashscreenWindow;


function createMainWindow() {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1280,
        defaultHeight: 720
    });

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 300,
        minHeight: 50,
        icon: path.join(__dirname, "../../../gui/images/logo_transparent_2.png"),
        show: false,
        titleBarStyle: "hiddenInset",
        backgroundColor: "#1E2023",
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            nativeWindowOpen: false,
            backgroundThrottling: false,
            contextIsolation: false,
            worldSafeExecuteJavaScript: false,
            enableRemoteModule: true
        }
    });

    mainWindow.webContents.on('new-window',
        (event, _url, frameName, _disposition, options) => {
            if (frameName === 'modal') {
                // open window as modal
                event.preventDefault();
                Object.assign(options, {
                    frame: true,
                    titleBarStyle: "default",
                    parent: mainWindow,
                    width: 250,
                    height: 400,
                    javascript: false,
                    webPreferences: {
                        webviewTag: true
                    }

                });
                event.newGuest = new BrowserWindow(options);
            }
        });

    //set a global reference, lots of backend files depend on this being available globally
    exports.mainWindow = mainWindow;
    global.renderWindow = mainWindow;

    const frontendCommunicator = require("../../common/frontend-communicator");
    const profileManager = require("../../common/profile-manager");
    const dataAccess = require("../../common/data-access");
    const menuTemplate = [
        {
            label: 'Edit',
            submenu: [
                {
                    role: 'cut'
                },
                {
                    role: 'copy'
                },
                {
                    role: 'paste'
                },
                {
                    role: "undo"
                },
                {
                    role: "redo"
                },
                {
                    role: "selectAll"
                }
            ]
        },
        {
            label: 'Window',
            submenu: [
                {
                    role: 'minimize'
                },
                {
                    role: 'close'
                },
                {
                    role: 'quit'
                }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Open Data Folder',
                    toolTip: "Open the folder where Firebot data is stored",
                    click: () => {
                        const rootFolder = path.resolve(
                            profileManager.getPathInProfile("/")
                        );
                        shell.openPath(rootFolder);
                    }
                },
                {
                    label: 'Open Logs Folder',
                    toolTip: "Open the folder where logs are stored",
                    click: () => {
                        const rootFolder = path.resolve(
                            dataAccess.getPathInUserData("/logs/")
                        );
                        shell.openPath(rootFolder);
                    }
                },
                {
                    label: 'Open Backups Folder',
                    toolTip: "Open the folder where backups are stored",
                    click: () => {
                        const backupFolder = path.resolve(
                            dataAccess.getPathInUserData("/backups/")
                        );
                        shell.openPath(backupFolder);
                    }
                },
                {
                    label: 'Setup Wizard',
                    toolTip: "Run the setup wizard again",
                    click: () => {
                        frontendCommunicator.send("open-modal", {
                            component: "setupWizardModal"
                        });
                    }
                },
                {
                    label: 'Custom Variable Inspector',
                    toolTip: "Open the custom variable inspector",
                    click: () => {
                        // eslint-disable-next-line no-use-before-define
                        createVariableInspectorWindow();
                    }
                },
                {
                    type: 'separator'
                },
                {
                    role: 'toggledevtools'
                }
            ]
        },
        {
            role: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        frontendCommunicator.send("open-about-modal");
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    // register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    // and restore the maximized or full screen state
    mainWindowState.manage(mainWindow);

    // and load the index.html of the app.
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "../../../gui/app/index.html"),
            protocol: "file:",
            slashes: true
        })
    );

    // wait for the main window's content to load, then show it
    mainWindow.webContents.on("did-finish-load", () => {

        createTray(mainWindow);

        mainWindow.show();
        if (splashscreenWindow) {
            splashscreenWindow.destroy();
        }

        const startupScriptsManager = require("../../common/handlers/custom-scripts/startup-scripts-manager");
        startupScriptsManager.runStartupScripts();

        const eventManager = require("../../events/EventManager");
        eventManager.triggerEvent("firebot", "firebot-started", {
            username: "Firebot"
        });

        fileOpenHelpers.setWindowReady(true);
    });

    mainWindow.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });

    mainWindow.on("close", (event) => {
        const connectionManager = require("../../common/connection-manager");
        const { settings } = require("../../common/settings-access");
        if (!settings.hasJustUpdated() && connectionManager.chatIsConnected() && connectionManager.streamerIsOnline()) {
            event.preventDefault();
            dialog.showMessageBox(mainWindow, {
                message: "Are you sure you want to close Firebot while connected to Twitch?",
                title: "Close Firebot",
                type: "question",
                buttons: ["Close Firebot", "Cancel"]

            }).then(({response}) => {
                if (response === 0) {
                    mainWindow.destroy();
                }
            }).catch(() => console.log("Error with close app confirmation"));
        }
    });
}

/**
 * Creates the splash screen
 */
const createSplashScreen = async () => {
    const isLinux = process.platform !== 'win32' && process.platform !== 'darwin';
    const splash = new BrowserWindow({
        width: 240,
        height: 325,
        icon: path.join(__dirname, "../../../gui/images/logo_transparent_2.png"),
        transparent: !isLinux,
        backgroundColor: isLinux ? "#34363C" : undefined,
        frame: false,
        closable: false,
        fullscreenable: false,
        movable: false,
        resizable: false,
        center: true,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    splashscreenWindow = splash;

    splash.on("ready-to-show", () => {
        splash.show();
    });

    return splash.loadURL(
        url.format({
            pathname: path.join(__dirname, "../../../gui/splashscreen/splash.html"),
            protocol: "file:",
            slashes: true
        }))
        .then(() => {
            logger.debug("Loaded splash screen");
        }).catch((reason) => {
            logger.error("Failed to load splash screen", reason);
        });
};

/**
 * Firebot's main window
 * Keeps a global reference of the window object, if you don't, the window will
 * be closed automatically when the JavaScript object is garbage collected.
 *@type {Electron.BrowserWindow}
 */
let streamPreview = null;

function createStreamPreviewWindow() {

    if (streamPreview != null && !streamPreview.isDestroyed()) {
        if (streamPreview.isMinimized()) {
            streamPreview.restore();
        }
        streamPreview.focus();
        return;
    }

    const accountAccess = require("../../common/account-access");
    const streamer = accountAccess.getAccounts().streamer;

    if (!streamer.loggedIn) {
        return;
    }

    const streamPreviewWindowState = windowStateKeeper({
        defaultWidth: 815,
        defaultHeight: 480,
        file: "stream-preview-window-state.json"
    });

    streamPreview = new BrowserWindow({
        frame: true,
        alwaysOnTop: true,
        backgroundColor: "#1E2023",
        title: "Stream Preview",
        parent: exports.mainWindow,
        width: streamPreviewWindowState.width,
        height: streamPreviewWindowState.height,
        x: streamPreviewWindowState.x,
        y: streamPreviewWindowState.y,
        javascript: false,
        webPreferences: {}
    });

    const view = new BrowserView();
    streamPreview.setBrowserView(view);
    view.setBounds({
        x: 0,
        y: 0,
        width: streamPreviewWindowState.width,
        height: streamPreviewWindowState.height - 10
    });
    view.setAutoResize({
        width: true,
        height: true
    });
    view.webContents.on('new-window', (vEvent) => {
        vEvent.preventDefault();
    });

    view.webContents.loadURL(`https://player.twitch.tv/?channel=${streamer.username}&parent=firebot&muted=true`);

    streamPreviewWindowState.manage(streamPreview);

    streamPreview.on("close", () => {
        if (!view.isDestroyed()) {
            view.destroy();
        }
    });
}

/**
 * The variable inspector window.
 *@type {Electron.BrowserWindow}
 */
let variableInspectorWindow = null;

async function createVariableInspectorWindow() {

    if (variableInspectorWindow != null && !variableInspectorWindow.isDestroyed()) {
        if (variableInspectorWindow.isMinimized()) {
            variableInspectorWindow.restore();
        }
        variableInspectorWindow.focus();
        return;
    }

    const variableInspectorWindowState = windowStateKeeper({
        defaultWidth: 720,
        defaultHeight: 1280,
        file: "variable-inspector-window-state.json"
    });

    variableInspectorWindow = new BrowserWindow({
        frame: true,
        alwaysOnTop: true,
        backgroundColor: "#2F3137",
        title: "Custom Variable Inspector",
        parent: exports.mainWindow,
        width: variableInspectorWindowState.width,
        height: variableInspectorWindowState.height,
        x: variableInspectorWindowState.x,
        y: variableInspectorWindowState.y,
        webPreferences: {
            preload: path.join(__dirname, "../../../gui/variable-inspector/preload.js")
        }
    });

    variableInspectorWindowState.manage(variableInspectorWindow);

    variableInspectorWindow.on("close", () => {
        variableInspectorWindow = null;
    });

    await variableInspectorWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "../../../gui/variable-inspector/index.html"),
            protocol: "file:",
            slashes: true
        }));

    const customVariableManager = require("../../common/custom-variable-manager");
    variableInspectorWindow.webContents.send("all-variables", customVariableManager.getInitialInspectorVariables());
}

function sendVariableCreateToInspector(key, value, ttl) {
    if (variableInspectorWindow == null || variableInspectorWindow.isDestroyed()) {
        return;
    }

    variableInspectorWindow.webContents.send("variable-set", {
        key,
        value,
        ttl
    });
}

function sendVariableExpireToInspector(key, value) {
    if (variableInspectorWindow == null || variableInspectorWindow.isDestroyed()) {
        return;
    }

    variableInspectorWindow.webContents.send("variable-expire", {
        key,
        value
    });
}

exports.createVariableInspectorWindow = createVariableInspectorWindow;
exports.sendVariableCreateToInspector = sendVariableCreateToInspector;
exports.sendVariableExpireToInspector = sendVariableExpireToInspector;
exports.createStreamPreviewWindow = createStreamPreviewWindow;
exports.createMainWindow = createMainWindow;
exports.createSplashScreen = createSplashScreen;