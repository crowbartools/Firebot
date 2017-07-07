const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// IPC for conveying events between main process and render processes.
const {ipcMain} = require('electron')

const path = require('path')
const url = require('url')
const fs = require('fs')

require('dotenv').config()

const GhReleases = require('electron-gh-releases')

// Handle Squirrel events
var handleStartupEvent = function() {
  if (process.platform !== 'win32') {
    return false;
  }

  var squirrelCommand = process.argv[1];
  switch (squirrelCommand) {
    case '--squirrel-install':
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

      // Always quit when done
      app.quit();

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

function pathExists(path) {
  return new Promise((resolve, reject) => {
    fs.access(path, (err) => {
      if(err) {
        //ENOENT means Error NO ENTity found, aka the file/folder doesn't exist.
        if(err.code === 'ENOENT') {
          // This folder doesn't exist. Resolve and create it.
          resolve();
        } else {
          // Some weird error happened other than the path missing.
          console.log(err)
        };
      } else {
        // This folder exists. Reject and don't touch it.
        console.log('Path Found: '+path)
        reject();
      }
    });
  });
};

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', function(){
    
    // Create the user-settings folder if it doesn't exist. It's required 
    // for the folders below that are within it
    pathExists("./user-settings/")
    .then((resolve) => {
      console.log("Can't find the user-settings folder, creating one now...");
      fs.mkdir("./user-settings");
    });

    // Create the scripts folder if it doesn't exist
    pathExists("./user-settings/scripts/")
    .then((resolve) => {
      console.log("Can't find the scripts folder, creating one now...");
      fs.mkdir("./user-settings/scripts");
    })
    
    // Create the overlay settings folder if it doesn't exist.
    pathExists("./user-settings/overlay-settings/")
    .then((resolve) => {
      console.log("Can't find the overlay-settings folder, creating one now...");
      fs.mkdir("./user-settings/overlay-settings");
    })
    
    // Create the port.js file if it doesn't exist.
    pathExists("./user-settings/overlay-settings/port.js")
    .then((resolve) => {
      fs.writeFile('./user-settings/overlay-settings/port.js', `window.WEBSOCKET_PORT = 8080`, 
        'utf8', () => { console.log(`Set overlay port to: 8080`)});
    })  

    // Create the controls folder if it doesn't exist.
    pathExists("./user-settings/controls")
    .then((resolve) => {
      console.log("Can't find the controls folder, creating one now...");
      fs.mkdir("./user-settings/controls");
    })  
    
    createWindow()
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
      if (!err && status) {
        console.log('Should we download an update? '+status);

        // Download the update
        updater.download()
      } else {
        console.log('Error: Could not start the auto updater.');
        console.log(err);
      }
    })

    // When an update has been downloaded
    updater.on('update-downloaded', (info) => {
      console.log('Updated downloaded. Installing...');
      // Restart the app and install the update
      updater.install()
    })

    // Access electrons autoUpdater
    updater.autoUpdater
  });


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Interactive handler
const mixerConnect = require('./lib/interactive/mixer-interactive.js');

