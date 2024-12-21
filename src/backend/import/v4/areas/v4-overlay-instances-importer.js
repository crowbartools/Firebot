"use strict";

const path = require("path");
const logger = require("../../../logwrapper");
const importHelpers = require("../import-helpers");
const { SettingsManager } = require("../../../common/settings-manager");


async function checkForV4SettingsFile() {
    const v4SettingsPath = path.join(importHelpers.v4DataPath, "/settings.json");
    return await importHelpers.pathExists(v4SettingsPath);
}

exports.run = async () => {
    const incompatibilityWarnings = [];

    const v4SettingsExists = await checkForV4SettingsFile();

    if (v4SettingsExists) {

        const v4SettingsDb = importHelpers.getJsonDbInV4Data("/settings.json");

        let allV4Settings;
        try {
            allV4Settings = v4SettingsDb.getData("/");
        } catch (err) {
            logger.warn("Failed to read v4 settings file.", err);
        }

        if (allV4Settings != null) {
            const useOverlayInstances = allV4Settings.settings.useOverlayInstances === true;
            SettingsManager.saveSetting("UseOverlayInstances", useOverlayInstances);

            const overlayInstances = allV4Settings.settings.overlayInstances || [];
            SettingsManager.saveSetting("OverlayInstances", overlayInstances);

            SettingsManager.flushSettingsCache();
        }
    }

    return {
        success: true,
        incompatibilityWarnings: incompatibilityWarnings
    };
};