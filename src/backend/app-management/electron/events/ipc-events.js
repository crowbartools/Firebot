"use strict";
const os = require('os');
const electron = require("electron");
const logger = require("../../../logwrapper");

module.exports = function () {
    const {
        app,
        desktopCapturer,
        ipcMain,
        screen
    } = electron;

    ipcMain.on('preload.getAppDetails', (event) => {
        event.returnValue = {
            version: app.getVersion(),
            locale: app.getLocale(),
            isPackaged: app.isPackaged,
            os: {
                isWindows: process.platform === 'win32',
                type: os.type(),
                release: os.release()
            }
        };
    });
    ipcMain.on('preload.app.getPath', (event, ...args) => {
        event.returnValue = app.getPath(...args);
    });
    ipcMain.on('preload.app.getAppPath', (event, ...args) => {
        event.returnValue = app.getAppPath(...args);
    });
    ipcMain.on('preload.screen.getAllDisplays', (event, ...args) => {
        event.returnValue = screen.getAllDisplays(...args);
    });
    ipcMain.on('preload.takeScreenshot', (event, displayId) => {
        const screens = screen.getAllDisplays();
        const matchingScreen = screens.find(d => d.id === displayId);

        const resolution = matchingScreen ? {
            width: matchingScreen.size.width * matchingScreen.scaleFactor,
            height: matchingScreen.size.height * matchingScreen.scaleFactor
        } : {
            width: 1920,
            height: 1080
        };

        desktopCapturer
            .getSources({
                types: ['screen'],
                thumbnailSize: resolution
            })
            .then(sources => {
                const foundSource = sources.find(s => s.display_id.toString() === displayId.toString());

                if (foundSource) {
                    event.returnValue = foundSource.thumbnail.toDataURL();
                }

                event.returnValue = null;
            }, err => {
                logger.error("Failed to take screenshot", err.message);
                event.returnValue = null;
            })
            .catch(err => {
                logger.error('Failed to take screenshot', err.message);
                event.returnValue = null;

            });
    });
};