'use strict';

const path = require('path');
const url = require('url');

const electron = require('electron');
const {app, BrowserWindow, ipcMain, shell, dialog} = electron;
const GhReleases = require('electron-gh-releases');
const settings = require('./lib/common/settings-access').settings;
const dataAccess = require('./lib/common/data-access.js');
const backupManager = require("./lib/backupManager");
const apiServer = require('./api/apiServer.js');

const Effect = require('./lib/common/EffectType');

// These are defined globally for Custom Scripts.
// We will probably wnat to handle these differently but we shouldn't
// change anything until we are ready as changing this will break most scripts
global.EffectType = Effect.EffectType;
global.SCRIPTS_DIR = dataAccess.getPathInUserData('/user-settings/scripts/');

// uncaught exception - log the error
process.on('uncaughtException', console.error);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Interactive handler
let mixerConnect;

// Handle Squirrel events for windows machines
if (process.platform === 'win32') {
    let cp;
    let updateDotExe;
    let target;
    let child;
    switch (process.argv[1]) {
    case '--squirrel-updated':
        // cleanup from last instance

        // use case-fallthrough to do normal installation

    case '--squirrel-install': //eslint-disable-line no-fallthrough
        // Optional - do things such as:
        // - Install desktop and start menu shortcuts
        // - Add your .exe to the PATH
        // - Write to the registry for things like file associations and explorer context menus

        // Install shortcuts
        cp = require('child_process');
        updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
        target = path.basename(process.execPath);
        child = cp.spawn(updateDotExe, ["--createShortcut", target], { detached: true });
        child.on('close', app.quit);
        return;

    case '--squirrel-uninstall':
        // Undo anything you did in the --squirrel-install and --squirrel-updated handlers

        // Remove shortcuts
        cp = require('child_process');
        updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
        target = path.basename(process.execPath);
        child = cp.spawn(updateDotExe, ["--removeShortcut", target], { detached: true });
        child.on('close', app.quit);
        return true;

    case '--squirrel-obsolete':
        // This is called on the outgoing version of your app before
        // we update to the new version - it's the opposite of
        // --squirrel-updated
        app.quit();
        return;
    }
}


function createWindow () {
    console.log('createWindow called');

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 600,
        icon: path.join(__dirname, './gui/images/logo.ico'),
        show: false
    });

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, './gui/app/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // wait for the main window's content to load, then show it
    mainWindow.webContents.on('did-finish-load', () => {
        // mainWindow.webContents.openDevTools();
        mainWindow.show();
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    // Global var for main window.
    global.renderWindow = mainWindow;

    // Register the Kill Switch
    mixerConnect.shortcut();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
    let port;

    //create the root "firebot-data" folder in user-settings
    dataAccess.createFirebotDataDir();

    // Create the user-settings folder if it doesn't exist. It's required
    // for the folders below that are within it
    dataAccess.userDataPathExists("/user-settings/").then(() => {
        console.log("Can't find the user-settings folder, creating one now...");
        dataAccess.makeDirInUserData("/user-settings");
    });

    // Create the scripts folder if it doesn't exist
    dataAccess.userDataPathExists("/user-settings/scripts/").then(() => {
        console.log("Can't find the scripts folder, creating one now...");
        dataAccess.makeDirInUserData("/user-settings/scripts");
    });

    // Create the scripts folder if it doesn't exist
    dataAccess.userDataPathExists("/backups/").then(() => {
        console.log("Can't find the backup folder, creating one now...");
        dataAccess.makeDirInUserData("/backups");
    });

    // Update the port.js file
    port = settings.getWebSocketPort();
    dataAccess.writeFileInWorkingDir(
        '/resources/overlay/js/port.js',
        `window.WEBSOCKET_PORT = ${port}`,
        () => {
            console.log(`Set overlay port to: ${port}`);
        });

    // Create the controls folder if it doesn't exist.
    dataAccess.userDataPathExists("/user-settings/controls")
        .then(() => {
            console.log("Can't find the controls folder, creating one now...");
            dataAccess.makeDirInUserData("/user-settings/controls");
        });

    // Create the logs folder if it doesn't exist.
    dataAccess.userDataPathExists("/user-settings/logs")
        .then(() => {
            console.log("Can't find the logs folder, creating one now...");
            dataAccess.makeDirInUserData("/user-settings/logs");
        });

    // Create the chat folder if it doesn't exist.
    dataAccess.userDataPathExists("/user-settings/chat")
        .then(() => {
            console.log("Can't find the chat folder, creating one now...");
            dataAccess.makeDirInUserData("/user-settings/chat");
        });

    createWindow();

    //start the REST api server
    apiServer.start();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (settings.backupOnExit()) {
        backupManager.startBackup(false, app.quit);

    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    } else if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// When Quitting.
app.on('will-quit', () => {

    // Unregister all shortcuts.
    mixerConnect.shortcutUnregister();
});

// Run Updater
ipcMain.on('downloadUpdate', () => {

    //back up first
    if (settings.backupBeforeUpdates()) {
        backupManager.startBackup();
    }

    // Download Update
    let options = {
        repo: 'firebottle/firebot',
        currentVersion: app.getVersion()
    };

    let updater = new GhReleases(options);

    updater.check((err, status) => {
        console.log('Should we download an update? ' + status);

        // Download the update
        updater.download();

        if (err) {
            console.log(err);
        }
    });

    // When an update has been downloaded
    updater.on('update-downloaded', () => {
        console.log('Updated downloaded. Installing...');
        //let the front end know and wait a few secs.
        renderWindow.webContents.send('updateDownloaded');

        setTimeout(function () {
        // Restart the app and install the update
            settings.setJustUpdated(true);

            updater.install();
        }, 3 * 1000);
    });

    // Access electrons autoUpdater
    // eslint-disable-next-line no-unused-expressions
    updater.autoUpdater;
});

// Opens the firebot root folder
ipcMain.on('openRootFolder', () => {
    // We include "fakefile.txt" as a workaround to make it open into the 'root' folder instead
    // of opening to the poarent folder with 'Firebot'folder selected.
    let rootFolder = path.resolve(dataAccess.getUserDataPath() + path.sep + "user-settings");
    shell.showItemInFolder(rootFolder);
});

// Get Import Folder Path
// This listens for an event from the render media.js file to open a dialog to get a filepath.
ipcMain.on('getImportFolderPath', (event, uniqueid) => {
    let path = dialog.showOpenDialog({
        title: "Select 'user-settings' folder",
        buttonLabel: "Import 'user-settings'",
        properties: ['openDirectory']
    });
    event.sender.send('gotImportFolderPath', {path: path, id: uniqueid});
});

// Opens the firebot backup folder
ipcMain.on('openBackupFolder', () => {
    // We include "fakefile.txt" as a workaround to make it open into the 'root' folder instead
    // of opening to the poarent folder with 'Firebot'folder selected.
    let backupFolder = path.resolve(dataAccess.getUserDataPath() + path.sep + "backups" + path.sep + "fakescript.js");
    shell.showItemInFolder(backupFolder);
});

ipcMain.on('startBackup', (event, manualActivation = false) => {
    backupManager.startBackup(manualActivation, () => {
        console.log("backup complete");
        renderWindow.webContents.send('backupComplete', manualActivation);
    });
});


mixerConnect = require('./lib/common/mixer-interactive.js');
