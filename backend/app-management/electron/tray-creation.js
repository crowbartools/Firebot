'use strict';

const path = require("path");

const electron = require("electron");
const { Menu, Tray, app } = electron;

const frontendCommunicator = require('../../common/frontend-communicator.js');
const { settings } = require("../../common/settings-access");

let mainTray;
let minimizedToTray = false;

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
    mainTray = new Tray(path.join(__dirname, "../../../gui/images/logo_transparent_2.png"));
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
        if (settings.getMinimizeToTray() && minimizedToTray !== true) {
            mainWindow.hide();
            minimizedToTray = true;
        }
    });

    mainWindow.on('focus', () => {
        if (minimizedToTray !== false) {
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