import { SettingsManager } from "../common/settings-manager";
import * as dataAccess from "../common/data-access";
import logger from "../logwrapper";

/**
 * Ensures a dir at the given path exists. Creates one if it doesn't
 * @param path - The dirs relative path
 */
async function ensureDirExists(path: string) {
    if (!await dataAccess.userDataPathExists(path)) {
        logger.info(`Can't find "${path}", creating...`);
        await dataAccess.makeDirInUserData(path);
    }
}

export async function ensureRequiredFoldersExist(): Promise<void> {
    logger.info("Ensuring required data folders exist...");

    //create the root "firebot-data" folder
    await dataAccess.createFirebotDataDir();

    // copy over overlay wrapper
    dataAccess.copyResourceToUserData(null, "overlay.html", "");

    const requiredRootDirPaths = ["/profiles", "/backups", "/clips", "/overlay-resources"];
    for (const path of requiredRootDirPaths) {
        await ensureDirExists(path);
    }

    // Setup required folders for each profile
    let activeProfiles: string[] = [];

    // Check to see if globalSettings file has active profiles listed, otherwise create it.
    // ActiveProfiles is a list of profiles that have not been deleted through the app.
    // This could happen if someone manually deletes a profile.
    activeProfiles = SettingsManager.getSetting("ActiveProfiles");

    if (!activeProfiles?.length) {
        activeProfiles = ["Main Profile"];
        SettingsManager.saveSetting("ActiveProfiles", activeProfiles);
    }

    // Check to see if we have a "loggedInProfile", if not select one.
    // If we DO have a loggedInProfile, check and make sure that profile is still in our active profile list, if not select the first in the active list.
    // All of this is backup, just in case. It makes sure that we at least have some profile logged in no matter what happens.
    const loggedInProfile = SettingsManager.getSetting("LoggedInProfile");

    if (loggedInProfile) {
        if (activeProfiles.indexOf(loggedInProfile) === -1) {
            logger.info("Last logged in profile is no longer on the active profile list. Changing it to an active one.");
            SettingsManager.saveSetting("LoggedInProfile", activeProfiles[0]);
        } else {
            logger.debug("Last logged in profile is still active!");
        }
    } else {
        logger.info("Last logged in profile info is missing or this is a new install. Adding it in now.");
        SettingsManager.saveSetting("LoggedInProfile", activeProfiles[0]);
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
            await ensureDirExists(profilePath);
        }
    }

    logger.info("Finished verifying required folders exist.");
}