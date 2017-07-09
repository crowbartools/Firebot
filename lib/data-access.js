const electron = require('electron');
const path = require('path');
const fs = require('fs');
const JsonDB = require('node-json-db');


// Renderer process has to get `app` module via `remote`, whereas the main process can get it directly
// app.getPath('userData') will return a string of the user's app data directory path.
// This is the path to the user data folder. IE: C:\Users\<user>\AppData\Roaming\Firebot\
// This stays the same after every update.
const userDataPath = (electron.app || electron.remote.app).getPath('userData');

var getUserDataPath = function() {
  return userDataPath;
}

var getJsonDbInUserData = function(filePath) {
  var jsonDbPath = path.join(userDataPath, filePath);
  return new JsonDB(jsonDbPath, true, true);
}


// This is the path to folder the app is currently living in. IE: C:\Users\<user>\AppData\Local\Firebot\app-4.0.0\
// This will change after every update.
const workingDirectoryPath = process.cwd()
    
var getWorkingDirectoryPath = function() {
  return workingDirectoryPath;
}

exports.getWorkingDirectoryPath = getWorkingDirectoryPath;
exports.getJsonDbInUserData = getJsonDbInUserData;
exports.getUserDataPath = getUserDataPath;