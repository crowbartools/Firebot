"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const { JsonDB } = require("node-json-db");

const appDataPath = electron.app.getPath("appData");
const v4DataPath = path.join(appDataPath, "Firebot/firebot-data/user-settings");
exports.v4DataPath = v4DataPath;

exports.pathExists = (path) => {
    return new Promise(resolve => {
        fs.access(path, err => {
            if (err) {
                //ENOENT means Error NO ENTity found, aka the file/folder doesn't exist.
                if (err.code === "ENOENT") {
                    // This folder doesn't exist. Resolve and create it.
                    resolve(false);
                } else {
                    // Some weird error happened other than the path missing.
                    const logger = require("../logwrapper");
                    logger.error(err);
                    resolve(false);
                }
            } else {
                resolve(true);
            }
        });
    });
};

/**
 * @returns JsonDB
 */
exports.getJsonDbInV4Data = function(filePath) {
    const jsonDbPath = path.join(v4DataPath, filePath);
    return new JsonDB(jsonDbPath, false, true);
};

// error types
class IncompatibilityError extends Error {
    constructor(reason, ...params) {
        super(reason, ...params);
        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, IncompatibilityError);
        }
        this.name = 'IncompatibilityError';
        this.reason = reason;
    }
}

exports.errors = {
    IncompatibilityError
};
