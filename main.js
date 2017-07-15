const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// IPC for conveying events between main process and render processes.
const {ipcMain, shell, dialog} = require('electron')

const path = require('path')
const url = require('url')
const fs = require('fs')

const JsonDb = require('node-json-db');

require('dotenv').config()

const GhReleases = require('electron-gh-releases');

const settings = require('./lib/interactive/settings-access').settings;

const dataAccess = require('./lib/data-access.js');

var ncp = require('ncp').ncp;
ncp.limit = 16;

// Handle Squirrel events
var handleStartupEvent = function() {
  if (process.platform !== 'win32') {
    return false;
  }

  var squirrelCommand = process.argv[1];
  switch (squirrelCommand) {
    case '--squirrel-install':

      // Install shortcuts
      var cp = require('child_process');    
      var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
      var target = path.basename(process.execPath);
      var child = cp.spawn(updateDotExe, ["--createShortcut", target], { detached: true });
      child.on('close', function(code) {
          app.quit();
      });

      return true;
    case '--squirrel-updated':

      // Optionally do things such as:
      //
      // - Install desktop and start menu shortcuts
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Always quit when done
      app.quit();

      return true;
    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove shortcuts
      var cp = require('child_process');    
      var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
      var target = path.basename(process.execPath);
      var child = cp.spawn(updateDotExe, ["--removeShortcut", target], { detached: true });
      child.on('close', function(code) {
          app.quit();
      });
      
      return true;
    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated
      app.quit();
      return true;
  }
};

if (handleStartupEvent()) {
  return;
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 650,
      minWidth: 600,
      icon: path.join(__dirname, './gui/images/logo.ico'),
      show: false
    })

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, './gui/app/index.html'),
      protocol: 'file:',
      slashes: true
    }))

    // Open dev tools
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null
    })

    // Global var for main window.
    global.renderWindow = mainWindow;

    // Register the Kill Switch
    mixerConnect.shortcut();
}

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', function(){
    
    //create the root "firebot-data" folder in user-settings
    dataAccess.createFirebotDataDir();
    
    // Create the user-settings folder if it doesn't exist. It's required 
    // for the folders below that are within it
    dataAccess.userDataPathExists("/user-settings/").then((resolve) => {
      console.log("Can't find the user-settings folder, creating one now...");
      dataAccess.makeDirInUserData("/user-settings");
    });

    // Create the scripts folder if it doesn't exist
    dataAccess.userDataPathExists("/user-settings/scripts/").then((resolve) => {
      console.log("Can't find the scripts folder, creating one now...");
      dataAccess.makeDirInUserData("/user-settings/scripts");
    });
    
    // Create the overlay settings folder if it doesn't exist.
    dataAccess.userDataPathExists("/user-settings/overlay-settings/")
    .then((resolve) => {
      console.log("Can't find the overlay-settings folder, creating one now...");
      dataAccess.makeDirInUserData("/user-settings/overlay-settings");
    });
    
    // Create the port.js file if it doesn't exist.
    dataAccess.userDataPathExists("/user-settings/overlay-settings/port.js")
    .then((resolve) => {
      dataAccess.writeFileInUserData(
        '/user-settings/overlay-settings/port.js', 
        `window.WEBSOCKET_PORT = 8080`,
        () => { console.log(`Set overlay port to: 8080`)});
    });  

    // Create the controls folder if it doesn't exist.
    dataAccess.userDataPathExists("/user-settings/controls")
    .then((resolve) => {
      console.log("Can't find the controls folder, creating one now...");
      dataAccess.makeDirInUserData("/user-settings/controls");
    });
    
    
    var overlayFolderExists = dataAccess.userDataPathExistsSync("/overlay/");
    var appVersion = electron.app.getVersion();
    if(!overlayFolderExists || settings.getOverlayVersion() !== appVersion) {
      
      var source = dataAccess.getPathInWorkingDir("/overlay");
      var destination = dataAccess.getPathInUserData("/overlay");    
      ncp(source, destination, function (err) {
       if (err) {
         console.log("Error copying Overlay folder to user data!");
         return console.error(err);
       }
       settings.setOverlayVersion(appVersion);
       console.log('Copied overlay folder to user data.');
      });
    }  
    
    createWindow();
    
    renderWindow.webContents.on('did-finish-load', function() {
        renderWindow.show();
    });
  })

  // Quit when all windows are closed.
  app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow()
    }
  })

  process.on('uncaughtException', function(error) {
      // Handle the error
      console.error(error);
  });

  // When Quittin.
  app.on('will-quit', () => {
    // Unregister all shortcuts.
    mixerConnect.shortcutUnregister();
  });
  
  // Run Updater
  ipcMain.on('downloadUpdate', function(event, uniqueid) {
    // Download Update
    let options = {
      repo: 'firebottle/test',
      currentVersion: app.getVersion()
    }

    var updater = new GhReleases(options)

    updater.check((err, status) => {
      if (!err) {
        console.log('Should we download an update? '+status);

        // Download the update
        updater.download();
      } else {
        renderWindow.webContents.send('updateError', "Could not start the updater.");
        console.log(err);
      }
    })

    // When an update has been downloaded
    updater.on('update-downloaded', (info) => {
      console.log('Updated downloaded. Installing...');
      //let the front end know and wait a few secs.
      renderWindow.webContents.send('updateDownloaded');
      
      setTimeout(function () {
        // Restart the app and install the update
        settings.setJustUpdated(true);
        
        updater.install();
      }, 3*1000);
    })

    // Access electrons autoUpdater
    updater.autoUpdater
  });
  
  // Opens the firebot root folder
  ipcMain.on('openRootFolder', function(event) {
    // We include "fakefile.txt" as a workaround to make it open into the 'root' folder instead 
    // of opening to the poarent folder with 'Firebot'folder selected. 
    var rootFolder = path.resolve(dataAccess.getUserDataPath() + path.sep + "user-settings");
    shell.showItemInFolder(rootFolder);
  });
  
  // Get Image File Path
  // This listens for an event from the render media.js file to open a dialog to get a filepath.
  ipcMain.on('getImportFolderPath', function(event, uniqueid) {
      var path = dialog.showOpenDialog({
          title: "Select 'user-settings' folder",
          buttonLabel: "Import 'user-settings'",
          properties: ['openDirectory']
      });
      event.sender.send('gotImportFolderPath', {path: path, id: uniqueid});
  });


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Interactive handler
const mixerConnect = require('./lib/interactive/mixer-interactive.js');

