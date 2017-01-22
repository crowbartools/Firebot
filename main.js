const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// IPC for conveying events between main process and render processes.
const {ipcMain} = require('electron')

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 1000, height: 600, resizable: false})

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, './gui/index.html'),
      protocol: 'file:',
      slashes: true,
      icon: path.join(__dirname, './gui/images/logo.png')
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
    beamConnect.shortcut();
}

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow)

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
    globalShortcut.unregisterAll()
  });

  // Update Checker
  // When window is done loading, check for updates.
  app.on('ready', () =>{
    renderWindow.webContents.on('did-finish-load', function() {
      updateChecker.check(app.getVersion());
    });
  })

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// JS related to log in and getting OAuth Info.
const login = require('./lib/login/login.js');

// Interactive handler
const beamConnect = require('./lib/interactive/beam-connect.js');

// Update Checker
// Sends version number to gui for displaying update notices.
const updateChecker = require('./lib/updates/update-check.js');
