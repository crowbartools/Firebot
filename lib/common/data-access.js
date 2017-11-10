'use strict';

const electron = require('electron');
const path = require('path');
const fs = require('fs');
const JsonDB = require('node-json-db');


// This is the path to folder the app is currently living in. IE: C:\Users\<user>\AppData\Local\Firebot\app-4.0.0\
// This will change after every update.
const workingDirectoryPath = process.cwd();

let getWorkingDirectoryPath = function() {
    return workingDirectoryPath;
};

// Renderer process has to get `app` module via `remote`, whereas the main process can get it directly
// app.getPath('userData') will return a string of the user's app data directory path.
// This is the path to the user data folder. IE: C:\Users\<user>\AppData\Roaming\Firebot\
// This stays the same after every update.
const rootUserDataPath = (electron.app || electron.remote.app).getPath('userData');
const userDataPath = rootUserDataPath + path.sep + "firebot-data";


let getPathInUserData = function(filePath) {
    return path.join(userDataPath, filePath);
};

let getPathInWorkingDir = function(filePath) {
    return path.join(workingDirectoryPath, filePath);
};

let getUserDataPath = function() {
    return userDataPath;
};

let createFirebotDataDir = function() {
    pathExists(userDataPath).then((resolve) => {
        console.log("Creating firebot-data folder...");
        fs.mkdir(userDataPath);
    });
};

let getJsonDbInUserData = function(filePath) {
    let jsonDbPath = path.join(userDataPath, filePath);
    return new JsonDB(jsonDbPath, true, true);
};

let makeDirInUserData = function(filePath) {
    let joinedPath = path.join(userDataPath, filePath);
    fs.mkdir(joinedPath);
};

let writeFileInWorkingDir = function(filePath, data, callback) {
    let joinedPath = path.join(workingDirectoryPath, filePath);
    fs.writeFile(joinedPath, data,
        'utf8', callback);
};

let writeFileInUserData = function(filePath, data, callback) {
    let joinedPath = path.join(userDataPath, filePath);
    fs.writeFile(joinedPath, data,
        'utf8', callback);
};

let workingDirPathExists = function(filePath) {
    let joinedPath = path.join(workingDirectoryPath, filePath);
    return pathExists(joinedPath);
};

let userDataPathExists = function(filePath) {
    let joinedPath = path.join(userDataPath, filePath);
    return pathExists(joinedPath);
};

let userDataPathExistsSync = function(filePath) {
    let joinedPath = path.join(userDataPath, filePath);
    return pathExistsSync(joinedPath);
};

function pathExists(path) {
    return new Promise((resolve, reject) => {
        fs.access(path, (err) => {
            if (err) {
                //ENOENT means Error NO ENTity found, aka the file/folder doesn't exist.
                if (err.code === 'ENOENT') {
                    // This folder doesn't exist. Resolve and create it.
                    resolve();
                } else {
                    // Some weird error happened other than the path missing.
                    console.log(err);
                }
            } else {
                // This folder exists. Reject and don't touch it.
                console.log('Path Found: ' + path);
                reject();
            }
        });
    });
}

function pathExistsSync(path) {
    return fs.existsSync(path);
}

exports.getPathInWorkingDir = getPathInWorkingDir;
exports.getPathInUserData = getPathInUserData;
exports.createFirebotDataDir = createFirebotDataDir;
exports.makeDirInUserData = makeDirInUserData;
exports.writeFileInWorkingDir = writeFileInWorkingDir;
exports.writeFileInUserData = writeFileInUserData;
exports.workingDirPathExists = workingDirPathExists;
exports.userDataPathExists = userDataPathExists;
exports.userDataPathExistsSync = userDataPathExistsSync;
exports.getWorkingDirectoryPath = getWorkingDirectoryPath;
exports.getJsonDbInUserData = getJsonDbInUserData;
exports.getUserDataPath = getUserDataPath;
