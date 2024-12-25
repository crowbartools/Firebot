'use strict';

const path = require("path");

const electron = require("electron");
const { Menu, Tray, app, nativeImage } = electron;

const frontendCommunicator = require('../../common/frontend-communicator.js');
const { SettingsManager } = require("../../common/settings-manager");

let mainTray;
let minimizedToTray = false;

const createNativeImage = () => {
    const iconPath =
            process.platform === "darwin"
                ? path.join(__dirname, "../../../gui/images/macTrayIcon.png")
                : path.join(__dirname, "../../../gui/images/logo_transparent_2.png");
    return nativeImage.createFromPath(iconPath);
};

module.exports = function createTray(mainWindow) {
    if (mainTray != null) {
        return;
    }

    const trayMenu = Menu.buildFromTemplate([
        {
            label: 'Show',
            type: 'normal',
            click: () => {
                if (minimizedToTray) {
                    mainWindow.show();
                    minimizedToTray = false;
                } else {
                    mainWindow.focus();
                }
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Exit',
            type: 'normal',
            click: () => {
                app.quit();
            }
        }
    ]);
    mainTray = new Tray(createNativeImage());
    mainTray.setToolTip('Firebot');
    mainTray.setContextMenu(trayMenu);

    mainTray.on('double-click', () => {
        if (minimizedToTray) {
            mainWindow.show();
            minimizedToTray = false;
        } else {
            mainWindow.focus();
        }
    });

    mainWindow.on('minimize', () => {
        if (SettingsManager.getSetting("MinimizeToTray") && minimizedToTray !== true) {
            mainWindow.hide();
            minimizedToTray = true;
        }
    });

    mainWindow.on('restore', () => {
        if (minimizedToTray) {
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            minimizedToTray = false;
        }

    });
    mainWindow.on('show', () => {
        if (minimizedToTray) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            minimizedToTray = false;
        }
    });
    mainWindow.on('focus', () => {
        if (minimizedToTray) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            minimizedToTray = false;
        }
    });

    frontendCommunicator.on('settings-updated-renderer', (evt) => {
        if (
            evt.path === '/settings/minimizeToTray' &&
            evt.data !== true &&
            minimizedToTray === true
        ) {
            mainWindow.show();
            minimizedToTray = false;
        }
    });
};