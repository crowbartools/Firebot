"use strict";

const logger = require("../../logwrapper");
const path = require("path");
const importHelpers = require("./import-helpers");
const frontendCommunicator = require("../../common/frontend-communicator");

//areas
const commandsImporter = require("./areas/v4-commands-importer");
const viewerGroupsImporter = require("./areas/v4-viewergroups-importer");
const hotkeysImporter = require("./areas/v4-hotkeys-importer");
const scriptsImporter = require("./areas/v4-scripts-importer");
const fontsImporter = require("./areas/v4-fonts-importer");
const overlayInstancesImporter = require("./areas/v4-overlay-instances-importer");

const v4DataPath = importHelpers.v4DataPath;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkForV4Data() {
    const v4SettingsPath = path.join(v4DataPath, "settings.json");
    const v4DataDetected = await importHelpers.pathExists(v4SettingsPath);
    logger.debug(`V4 Data Detected: ${v4DataDetected}`);
    return v4DataDetected;
}

async function importV4Data(settings) {
    const v4DataDetected = await checkForV4Data();

    logger.info("Starting v4 import...");

    // no v4 data detected
    if (!v4DataDetected) {
        return;
    }

    logger.info("v4 data detected! Continuing...");

    frontendCommunicator.send("v4-import-started");
    await wait(50);

    //keep track of incompatibility issues so we can display them to the user later
    let incompatibilityWarnings = [];

    if (settings.commands) {

        logger.info("Importing v4 commands data...");

        frontendCommunicator.send("v4-import-update", { importing: "Chat Commands" });

        await wait(2000);

        const commandsResult = await commandsImporter.run();

        incompatibilityWarnings = incompatibilityWarnings.concat(commandsResult.incompatibilityWarnings);
    }

    if (settings.viewerGroups) {

        logger.info("Importing v4 viewer group data...");

        frontendCommunicator.send("v4-import-update", { importing: "Viewer Groups (Roles)" });

        await wait(2000);

        const viewerGroupsResult = await viewerGroupsImporter.run();

        incompatibilityWarnings = incompatibilityWarnings.concat(viewerGroupsResult.incompatibilityWarnings);
    }

    if (settings.hotkeys) {

        logger.info("Importing v4 hotkey data...");

        frontendCommunicator.send("v4-import-update", { importing: "Hotkeys" });

        await wait(2000);

        const hotkeysResult = await hotkeysImporter.run();

        incompatibilityWarnings = incompatibilityWarnings.concat(hotkeysResult.incompatibilityWarnings);
    }

    if (settings.misc) {
        logger.info("Importing v4 misc data...");

        frontendCommunicator.send("v4-import-update", { importing: "Extras (Custom Scripts)" });

        await wait(2000);

        const scriptsResult = await scriptsImporter.run();

        incompatibilityWarnings = incompatibilityWarnings.concat(scriptsResult.incompatibilityWarnings);


        frontendCommunicator.send("v4-import-update", { importing: "Extras (Fonts)" });

        await wait(2000);

        const fontsResult = await fontsImporter.run();

        incompatibilityWarnings = incompatibilityWarnings.concat(fontsResult.incompatibilityWarnings);


        frontendCommunicator.send("v4-import-update", { importing: "Extras (Overlay Instances)" });

        await wait(2000);

        const overlayInstancesResult = await overlayInstancesImporter.run();

        incompatibilityWarnings = incompatibilityWarnings.concat(overlayInstancesResult.incompatibilityWarnings);
    }

    logger.info("V4 import completed!");
    logger.info(incompatibilityWarnings);

    frontendCommunicator.send("v4-import-complete", { success: true, incompatibilityWarnings: incompatibilityWarnings });
}

function setupListeners() {
    frontendCommunicator.on("start-v4-import", (importSettings) => {
        importV4Data(importSettings);
    });

    frontendCommunicator.onAsync("v4-data-check", async () => {
        return await checkForV4Data();
    });
}


exports.checkForV4Data = checkForV4Data;
exports.importV4Data = importV4Data;
exports.setupListeners = setupListeners;