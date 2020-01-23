"use strict";

const logger = require("../../logwrapper");
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const importHelpers = require("./import-helpers");

const appDataPath = electron.app.getPath("appData");
const v4DataPath = path.join(appDataPath, "Firebot/firebot-data/user-settings");


async function checkForV4Data() {
    const v4SettingsPath = path.join(v4DataPath, "settings.json");
    const v4DataDetected = await importHelpers.pathExists(v4SettingsPath);
    logger.debug("V4 Data Detected: " + v4DataDetected);
    return v4DataDetected;
}

async function importV4Data() {
    const v4DataDetected = await checkForV4Data();

    // no v4 data detected
    if (!v4DataDetected) return;


}

exports.checkForV4Data = checkForV4Data;
exports.importV4Data = importV4Data;
