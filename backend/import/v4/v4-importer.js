"use strict";

const logger = require("../../logwrapper");
const path = require("path");
const importHelpers = require("./import-helpers");

//areas
const mixplayImporter = require("./areas/v4-mixplay-importer");

const v4DataPath = importHelpers.v4DataPath;

async function checkForV4Data() {
    const v4SettingsPath = path.join(v4DataPath, "settings.json");
    const v4DataDetected = await importHelpers.pathExists(v4SettingsPath);
    logger.debug("V4 Data Detected: " + v4DataDetected);
    return v4DataDetected;
}

async function importV4Data(settings) {
    const v4DataDetected = await checkForV4Data();

    // no v4 data detected
    if (!v4DataDetected) return;

    //keep track of incompatibility issues so we can display them to the user later
    let incompatibilityWarnings = [];

    if (settings.mixplay) {
        let result = await mixplayImporter.run();

        incompatibilityWarnings = incompatibilityWarnings.concat(result.incompatibilityWarnings);
    }
}

exports.checkForV4Data = checkForV4Data;
exports.importV4Data = importV4Data;
