"use strict";

const logger = require("../logwrapper");
const frontendCommunicator = require("../common/frontend-communicator");

let pendingSetupFilePath;
let windowReady = false;

function sendSetupPathToFrontend(path) {
    frontendCommunicator.send("setup-opened", path);
}
exports.setWindowReady = (ready) => {
    windowReady = ready;
    if (windowReady && pendingSetupFilePath) {
        sendSetupPathToFrontend(pendingSetupFilePath);
        pendingSetupFilePath = null;
    }
};

/**
 *
 * @param {string} filePath
 */
exports.checkForFirebotSetupInPath = (filePath) => {
    if (filePath.endsWith(".firebotsetup")) {
        logger.info("Firebot setup file opened!", filePath);
        if (windowReady) {
            sendSetupPathToFrontend(filePath);
        } else {
            pendingSetupFilePath = filePath;
        }
        return true;
    }
    return false;
};

/**
 * @param {string[]} args
 */
exports.checkForFirebotSetupPathInArgs = (args) => {
    if (args == null) {
        return;
    }
    for (const arg of args) {
        exports.checkForFirebotSetupInPath(arg);
    }
};