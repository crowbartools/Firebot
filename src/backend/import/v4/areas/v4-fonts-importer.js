"use strict";

const path = require("path");
const logger = require("../../../logwrapper");
const importHelpers = require("../import-helpers");
const fse = require("fs-extra");
const profileManager = require("../../../common/profile-manager");

const v4FontsPath = path.join(importHelpers.v4DataPath, "/fonts");
const v5FontsPath = profileManager.getPathInProfile("/fonts");

async function checkForV4Fonts() {
    let hasFonts = false;
    try {
        const files = await fse.readdir(v4FontsPath);
        hasFonts = files != null && files.length > 0;
    } catch (err) {
        logger.warn("Unable to read fonts folder.", err);
    }
    return hasFonts;
}

exports.run = async () => {
    const incompatibilityWarnings = [];

    const v4FontsExist = await checkForV4Fonts();

    if (v4FontsExist) {
        try {
            await fse.copy(v4FontsPath, v5FontsPath);
        } catch (err) {
            incompatibilityWarnings.push("Unable to import V4 Fonts as an error occurred.");
            logger.warn("Unable to copy v4 fonts.", err);
        }
    }

    return {
        success: true,
        incompatibilityWarnings: incompatibilityWarnings
    };
};