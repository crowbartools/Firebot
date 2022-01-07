"use strict";

const path = require("path");
const logger = require("../../../logwrapper");
const importHelpers = require("../import-helpers");
const { settings } = require("../../../common/settings-access");


async function checkForV4SettingsFile() {
    const v4SettingsPath = path.join(importHelpers.v4DataPath, "/settings.json");
    return await importHelpers.pathExists(v4SettingsPath);
}

exports.run = async () => {
    let incompatibilityWarnings = [];

    let v4SettingsExists = await checkForV4SettingsFile();

    if (v4SettingsExists) {

        let v4SettingsDb = importHelpers.getJsonDbInV4Data("/settings.json");

        let allV4Settings;
        try {
            allV4Settings = v4SettingsDb.getData("/");
        } catch (err) {
            logger.warn("Failed to read v4 settings file.", err);
        }

        if (allV4Settings != null) {
            let useOverlayInstances = allV4Settings.settings.useOverlayInstances === true;
            settings.setUseOverlayInstances(useOverlayInstances);

            let overlayInstances = allV4Settings.settings.overlayInstances || [];
            settings.setOverlayInstances(overlayInstances);

            settings.flushSettingsCache();
        }
    }

    return {
        success: true,
        incompatibilityWarnings: incompatibilityWarnings
    };
};