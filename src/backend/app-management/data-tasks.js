"use strict";

const logger = require("../logwrapper");
const dataAccess = require("../common/data-access");

/**
 * Ensures a dir at the given path exists. Creates one if it doesn't
 * @param {string} path - The dirs relative path
 */
function ensureDirExists(path) {
    if (!dataAccess.userDataPathExistsSync(path)) {
        logger.info(`Can't find "${path}", creating...`);
        dataAccess.makeDirInUserDataSync(path);
    }
}

function ensureRequiredFoldersExist() {

    logger.info("Ensuring required data folders exist...");

    //create the root "firebot-data" folder
    dataAccess.createFirebotDataDir();

    // copy over overlay wrapper
    dataAccess.copyResourceToUserData(null, "overlay.html", "");

    const requiredRootDirPaths = ["/profiles", "/backups", "/clips", "/overlay-resources"];
    for (const path of requiredRootDirPaths) {
        ensureDirExists(path);
    }

    // Setup required folders for each profile
    const globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings");
    let activeProfiles = [];

    // Check to see if globalSettings file has active profiles listed, otherwise create it.
    // ActiveProfiles is a list of profiles that have not been deleted through the app.
    // This could happen if someone manually deletes a profile.
    try {
        activeProfiles = globalSettingsDb.getData("/profiles/activeProfiles");
    } catch (err) {
        globalSettingsDb.push("/profiles/activeProfiles", ["Main Profile"]);
        activeProfiles = ["Main Profile"];
    }

    // Check to see if we have a "loggedInProfile", if not select one.
    // If we DO have a loggedInProfile, check and make sure that profile is still in our active profile list, if not select the first in the active list.
    // All of this is backup, just in case. It makes sure that we at least have some profile logged in no matter what happens.
    try {
        if (activeProfiles.indexOf(globalSettingsDb.getData("/profiles/loggedInProfile")) === -1) {
            globalSettingsDb.push("/profiles/loggedInProfile", activeProfiles[0]);
            logger.info("Last logged in profile is no longer on the active profile list. Changing it to an active one.");
        } else {
            logger.debug("Last logged in profile is still active!");
        }
    } catch (err) {
        globalSettingsDb.push("/profiles/loggedInProfile", activeProfiles[0]);
        logger.info("Last logged in profile info is missing or this is a new install. Adding it in now.");
    }

    for (const profileId of activeProfiles) {
        if (profileId == null) {
            continue;
        }

        const requiredProfileDirPaths = [
            `/profiles/${profileId}`,
            `/profiles/${profileId}/scripts`,
            `/profiles/${profileId}/chat`,
            `/profiles/${profileId}/currency`,
            `/profiles/${profileId}/counters`,
            `/profiles/${profileId}/fonts`,
            `/profiles/${profileId}/events`,
            `/profiles/${profileId}/roles`,
            `/profiles/${profileId}/db`,
            `/profiles/${profileId}/effects`
        ];

        for (const profilePath of requiredProfileDirPaths) {
            ensureDirExists(profilePath);
        }
    }

    logger.info("Finished verifying required folders exist.");
}

exports.ensureRequiredFoldersExist = ensureRequiredFoldersExist;