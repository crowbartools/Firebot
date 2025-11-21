import fs from "fs";
import { ProfileManager } from "../common/profile-manager";
import { SettingsManager } from "../common/settings-manager";
import * as dataAccess from "../common/data-access";
import logger from "../logwrapper";

export function handleProfileRename() {
    if (!ProfileManager.hasProfileRename()) {
        return;
    }

    try {
        const currentProfileId = ProfileManager.getLoggedInProfile(),
            newProfileId = ProfileManager.getNewProfileName(),
            activeProfiles = SettingsManager.getSetting("ActiveProfiles");

        // Stop here if we have no deleted profile info.
        if (currentProfileId != null && newProfileId != null && newProfileId !== "") {
            // Delete the profile.
            logger.warn(`Profile ${currentProfileId} is marked for renaming. Renaming it now.`);

            const currentProfilePath = dataAccess.getPathInUserData(`/profiles/${currentProfileId}`);
            const renamedProfilePath = dataAccess.getPathInUserData(`/profiles/${newProfileId}`);
            logger.warn(currentProfilePath);

            try {
                fs.renameSync(currentProfilePath, renamedProfilePath);
            } catch (err) {
                logger.error("Failed to rename profile!", err);
                return;
            }

            // Remove old id from active profiles and add new
            const profilePosition = activeProfiles.indexOf(currentProfileId);
            activeProfiles[profilePosition] = newProfileId;
            SettingsManager.saveSetting("ActiveProfiles", activeProfiles);
            SettingsManager.saveSetting("LoggedInProfile", newProfileId);

            // Let our logger know we successfully deleted a profile.
            logger.warn(`Successfully renamed profile "${currentProfileId}" to "${newProfileId}"`);
        }
    } catch (err) {
        logger.error("error while renaming profile!", err);
        return;
    }
}

export function handleProfileDeletion() {
    let deletedProfile: string, activeProfiles: string[];
    try {
        deletedProfile = SettingsManager.getSetting("DeleteProfile");
        activeProfiles = SettingsManager.getSetting("ActiveProfiles");
    } catch (error) {
        if ((error as Error).name === 'DatabaseError') {
            logger.error("Error loading deleted and active profiles", error);
        }
    }

    // Stop here if we have no deleted profile info.
    if (deletedProfile == null) {
        return;
    }

    try {

        // Delete the profile.
        logger.warn(`Profile ${deletedProfile} is marked for deletion. Removing it now.`);

        const profilePath = dataAccess.getPathInUserData(`/profiles/${deletedProfile}`);

        logger.warn(profilePath);
        dataAccess.deleteFolderRecursive(profilePath);

        // Remove it from active profiles.
        const profilePosition = activeProfiles.indexOf(deletedProfile);
        if (profilePosition > -1) {
            activeProfiles.splice(profilePosition, 1);
            SettingsManager.saveSetting("ActiveProfiles", activeProfiles);
        }

        // Remove loggedInProfile setting and let restart process handle it.
        if (activeProfiles.length > 0 && activeProfiles != null) {
            // Switch to whatever the first profile is in our new active profiles list.
            SettingsManager.saveSetting("LoggedInProfile", activeProfiles[0]);
        } else {
            // We have no more active profiles, delete the loggedInProfile setting.
            SettingsManager.deleteSetting("LoggedInProfile");
        }

        // Reset the deleteProfile setting.
        SettingsManager.deleteSetting("DeleteProfile");

        // Let our logger know we successfully deleted a profile.
        logger.warn(`Successfully deleted profile: ${deletedProfile}`);

    } catch (err) {
        logger.error("error while deleting profile: ", err);
        return;
    }
}