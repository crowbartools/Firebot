const {ipcMain} = require('electron');
const {settings} = require('./common/settings-access');
const {autoUpdater} = require('electron-updater');

autoUpdater.autoDownload = false;
autoUpdater.allowPrerelease = settings.getAutoUpdateLevel() == 4;

var initialized = false;

function startDownload() {
    autoUpdater.checkForUpdates();
    autoUpdater.downloadUpdate();
}

function init() {

    if(initialized) return;
    initialized = true;
    console.log("Auto Updater running...");

    // Run Updater
    ipcMain.on('downloadUpdate', function(event, uniqueid) {
        
        //back up first
        if(settings.backupBeforeUpdates()) {
            backupManager.startBackup(false, () => {
                startDownload();
            });
        } else {
            startDownload();
        }

        autoUpdater.on('error', (err) => {
            console.log(err);
            renderWindow.webContents.send('updateError', "There was an error while auto updating. Error: " + err);
        });

        autoUpdater.on('download-progress', (progressObj) => {
            renderWindow.webContents.send('updateProgress', progressObj);
        });       

        // When an update has been downloaded
        autoUpdater.on('update-downloaded', (info) => {
            console.log('Updated downloaded. Installing...');
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
