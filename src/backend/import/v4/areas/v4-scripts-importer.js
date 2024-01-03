"use strict";

const path = require("path");
const logger = require("../../../logwrapper");
const importHelpers = require("../import-helpers");
const fse = require("fs-extra");
const profileManager = require("../../../common/profile-manager");
const { settings } = require("../../../common/settings-access");

const v4ScriptsPath = path.join(importHelpers.v4DataPath, "/scripts");
const v5ScriptsPath = profileManager.getPathInProfile("/scripts");

async function checkForV4Scripts() {
    let hasScripts = false;
    try {
        const files = await fse.readdir(v4ScriptsPath);
        hasScripts = files != null && files.length > 0;
    } catch (err) {
        logger.warn("Unable to read scripts folder.", err);
    }
    return hasScripts;
}

exports.run = async () => {
    const incompatibilityWarnings = [];

    const v4ScriptsExist = await checkForV4Scripts();

    if (v4ScriptsExist) {
        try {
            await fse.copy(v4ScriptsPath, v5ScriptsPath);
        } catch (err) {
            incompatibilityWarnings.push("Unable to import V4 Scripts as an error occurred.");
            logger.warn("Unable to copy v4 scripts.", err);
        }

        const v4SettingsDb = importHelpers.getJsonDbInV4Data("/settings.json");

        let allV4Settings;
        try {
            allV4Settings = v4SettingsDb.getData("/");
        } catch (err) {
            logger.warn("Failed to read v4 settings file.", err);
        }

        if (allV4Settings != null) {
            const runCustomScripts = allV4Settings.settings.runCustomScripts === true;
            settings.setCustomScriptsEnabled(runCustomScripts);

            settings.flushSettingsCache();
        }

    }

    return {
        success: true,
        incompatibilityWarnings: incompatibilityWarnings
    };
};