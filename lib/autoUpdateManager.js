'use strict';

const {ipcMain} = require('electron');
const {settings} = require('./common/settings-access');
const {autoUpdater} = require('electron-updater');
const backupManager = require("./backupManager");
const logger = require('./logwrapper');

autoUpdater.autoDownload = false;
autoUpdater.allowPrerelease = settings.getAutoUpdateLevel() === 4;

let initialized = false;

function startDownload() {
    autoUpdater.checkForUpdates();
    autoUpdater.downloadUpdate();
}

function init() {

    if (initialized) return;
    initialized = true;
    logger.info("Auto Updater running...");

    // Run Updater
    ipcMain.on('downloadUpdate', () => {

        //back up first
        backupManager.startBackup(false, () => {
            startDownload();
        });

        autoUpdater.on('error', (err) => {
            logger.error(err);
            renderWindow.webContents.send('updateError', "There was an error while auto updating. Error: " + err);
        });

        autoUpdater.on('download-progress', (progressObj) => {
            renderWindow.webContents.send('updateProgress', progressObj);
        });

        // When an update has been downloaded
        autoUpdater.on('update-downloaded', () => {
            logger.info('Updated downloaded. Installing...');
            //let the front end know and wait a few secs.
            renderWindow.webContents.send('updateDownloaded');

            setTimeout(function () {
                settings.setJustUpdated(true);

                // Restart the app and install the update
                autoUpdater.quitAndInstall();
            }, 5000);
        });
    });
}

exports.init = init;
