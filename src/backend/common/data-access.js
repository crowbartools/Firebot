"use strict";

const electron = require("electron");
const path = require("path");
const fs = require("fs");
const { JsonDB } = require("node-json-db");

const argv = require('./argv-parser');

let app = electron.app;
if (app == null && firebotAppDetails != null) {
    app = firebotAppDetails;
}
const isDev = !app.isPackaged;

// This is the path to folder the app is currently living in. IE: C:\Users\<user>\AppData\Local\Firebot\app-4.0.0\
// This will change after every update.
const workingDirectoryRoot = process.platform === 'darwin' ? process.resourcesPath : path.dirname(process.execPath);
const workingDirectoryPath = isDev ? path.join(app.getAppPath(), "build") : workingDirectoryRoot;

const getWorkingDirectoryPath = function () {
    return workingDirectoryPath;
};

// Renderer process has to get `app` module via `d`, whereas the main process can get it directly
// app.getPath('userData') will return a string of the user's app data directory path.
// This is the path to the user data folder. IE: C:\Users\<user>\AppData\Roaming\Firebot\
// This stays the same after every update.
const appDataPath = app.getPath("appData");

let userDataPath, tmpDirectoryPath;
if (Object.hasOwn(argv, 'fbuser-data-directory') && argv['fbuser-data-directory'] != null && argv['fbuser-data-directory'] !== '') {
    userDataPath = argv['fbuser-data-directory'];
    tmpDirectoryPath = path.join(userDataPath, './tmp');
} else {
    const rootUserDataPath = `${appDataPath + path.sep}Firebot`;
    userDataPath = `${rootUserDataPath + path.sep}v5`;
    tmpDirectoryPath = path.join(rootUserDataPath, "tmp");
}

const getPathInUserData = function (filePath) {
    return path.join(userDataPath, filePath);
};

const getPathInWorkingDir = function (filePath) {
    return path.join(workingDirectoryPath, filePath);
};

const getPathInTmpDir = function (filePath) {
    return path.join(tmpDirectoryPath, filePath);
};

const deletePathInTmpDir = function (filePath) {
    fs.unlinkSync(path.join(tmpDirectoryPath, filePath));
};

const deletePathInUserData = function (filePath) {
    fs.unlinkSync(path.join(userDataPath, filePath));
};

const deleteFolderRecursive = function (pathname) {
    if (fs.existsSync(pathname)) {
        fs.readdirSync(pathname).forEach(function (file) {
            const curPath = path.join(pathname, file);
            if (fs.statSync(curPath).isDirectory()) {
                // recurse
                deleteFolderRecursive(curPath);
            } else {
                // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(pathname);
    }
};

const getUserDataPath = function () {
    return userDataPath;
};

function pathExists(path) {
    return new Promise((resolve) => {
        fs.access(path, (err) => {
            if (err) {
                //ENOENT means Error NO ENTity found, aka the file/folder doesn't exist.
                if (err.code === "ENOENT") {
                    // This folder doesn't exist. Resolve and create it.
                    resolve(false);
                } else {
                    const logger = require("../logwrapper");
                    // Some weird error happened other than the path missing.
                    logger.error(err);
                }
            } else {
                resolve(true);
            }
        });
    });
}

const createFirebotDataDir = function () {
    if (!pathExists(userDataPath)) {
        const logger = require("../logwrapper");
        logger.info("Creating firebot-data folder...");
        fs.mkdirSync(userDataPath);
    }
};

const getJsonDbInUserData = function (filePath) {
    const jsonDbPath = path.join(userDataPath, filePath);
    return new JsonDB(jsonDbPath, true, true);
};

const makeDirInUserData = async function (filePath) {
    new Promise((resolve) => {
        const joinedPath = path.join(userDataPath, filePath);
        fs.mkdir(joinedPath, () => {
            resolve();
        });
    });
};

const makeDirInUserDataSync = function (filePath) {
    try {
        const joinedPath = path.join(userDataPath, filePath);
        fs.mkdirSync(joinedPath);
        return true;
    } catch (err) {
        const logger = require("../logwrapper");
        logger.error(`Error creating ${filePath}: ${err}`);
        return false;
    }
};

const writeFileInWorkingDir = function (filePath, data, callback) {
    const joinedPath = path.join(workingDirectoryPath, filePath);
    fs.writeFile(joinedPath, data, { encoding: "utf8" }, callback);
};

const writeFileInUserData = function (filePath, data, callback) {
    const joinedPath = path.join(userDataPath, filePath);
    fs.writeFile(joinedPath, data, { encoding: "utf8" }, callback);
};

const copyDefaultConfigToUserData = function (
    configFileName,
    userDataDestination
) {
    const source = getPathInWorkingDir(
        `/resources/default-configs/${configFileName}`
    );
    const destination = getPathInUserData(
        `${userDataDestination}/${configFileName}`
    );
    fs.writeFileSync(destination, fs.readFileSync(source));
};

const copyResourceToUserData = function (
    resourcePath = "",
    resourceName,
    userDataDestination = ""
) {
    try {
        const source = getPathInWorkingDir(
            resourcePath == null || resourcePath === ""
                ? path.join("resources", resourceName)
                : path.join("resources", resourcePath, resourceName)
        );

        const destination = getPathInUserData(
            path.join(userDataDestination, resourceName)
        );
        fs.writeFileSync(destination, fs.readFileSync(source));
    } catch (error) {
        const logger = require("../logwrapper");
        logger.error(`Failed to copy resource ${resourceName}`, error);
    }
};

const workingDirPathExists = function (filePath) {
    const joinedPath = path.join(workingDirectoryPath, filePath);
    return pathExists(joinedPath);
};

const userDataPathExists = function (filePath) {
    const joinedPath = path.join(userDataPath, filePath);
    return pathExists(joinedPath);
};

function pathExistsSync(path) {
    return fs.existsSync(path);
}

const userDataPathExistsSync = function (filePath) {
    const joinedPath = path.join(userDataPath, filePath);
    return pathExistsSync(joinedPath);
};

exports.getPathInWorkingDir = getPathInWorkingDir;
exports.getPathInUserData = getPathInUserData;
exports.createFirebotDataDir = createFirebotDataDir;
exports.makeDirInUserData = makeDirInUserData;
exports.makeDirInUserDataSync = makeDirInUserDataSync;
exports.writeFileInWorkingDir = writeFileInWorkingDir;
exports.writeFileInUserData = writeFileInUserData;
exports.copyDefaultConfigToUserData = copyDefaultConfigToUserData;
exports.copyResourceToUserData = copyResourceToUserData;
exports.workingDirPathExists = workingDirPathExists;
exports.userDataPathExists = userDataPathExists;
exports.userDataPathExistsSync = userDataPathExistsSync;
exports.getWorkingDirectoryPath = getWorkingDirectoryPath;
exports.getJsonDbInUserData = getJsonDbInUserData;
exports.getUserDataPath = getUserDataPath;
exports.getTmpDirectory = tmpDirectoryPath;
exports.getPathInTmpDir = getPathInTmpDir;
exports.deletePathInTmpDir = deletePathInTmpDir;
exports.deletePathInUserData = deletePathInUserData;
exports.deleteFolderRecursive = deleteFolderRecursive;
