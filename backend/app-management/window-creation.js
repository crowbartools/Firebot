"use strict";

const electron = require("electron");
const { BrowserWindow, Menu, shell } = electron;
const path = require("path");
const url = require("url");
const windowStateKeeper = require("electron-window-state");

function buildMainWindow() {

    const logger = require("../logwrapper");

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
        icon: path.join(__dirname, "../../gui/images/logo_transparent_2.png"),
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    const frontendCommunicator = require("../common/frontend-communicator");
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
                }
            ]
        },

        {
            label: 'View',
            submenu: [
                {
                    role: 'resetzoom'
                },
                {
                    role: 'zoomin'
                },
                {
                    role: 'zoomout'
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
            label: 'Window',
            submenu: [
                {
                    role: 'minimize'
                },
                {
                    role: 'close'
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
            pathname: path.join(__dirname, "../../gui/app/index.html"),
            protocol: "file:",
            slashes: true
        })
    );

    return mainWindow;
}

/**
 *
 * @param {Electron.BrowserWindow} window
 * @param {Electron.BrowserWindow} splashScreen
 */
function setupWindowListeners(window, splashScreen) {
    // wait for the main window's content to load, then show it
    window.webContents.on("did-finish-load", () => {
        window.show();
        splashScreen.destroy();
        const eventManager = require("../events/EventManager");
        eventManager.triggerEvent("firebot", "firebot-started", {
            username: "Firebot"
        });
    });

    window.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });
}

/**
 * Creates the splash screen
 * @returns {Electron.BrowserWindow}
 */
function buildSplashScreen() {
    const splash = new BrowserWindow({
        width: 300,
        height: 350,
        icon: path.join(__dirname, "../../gui/images/logo_transparent_2.png"),
        transparent: true,
        frame: false,
        closable: false,
        fullscreenable: false,
        movable: false,
        resizable: false,
        hasShadow: true,
        alwaysOnTop: false
    });
    splash.loadURL(
        url.format({
            pathname: path.join(__dirname, "../../gui/splashscreen/splash.html"),
            protocol: "file:",
            slashes: true
        }));
    return splash;
}

exports.buildMainWindow = buildMainWindow;
exports.buildSplashScreen = buildSplashScreen;
exports.setupWindowListeners = setupWindowListeners;