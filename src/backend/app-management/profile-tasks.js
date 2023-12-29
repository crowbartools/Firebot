"use strict";
const logger = require("../logwrapper");
const dataAccess = require("../common/data-access");
const profileManager = require("../common/profile-manager");
const fs = require("fs");

function handleProfileRename() {
    if (!profileManager.hasProfileRename()) {
        return;
    }
    const globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings");

    try {
        const currentProfileId = profileManager.getLoggedInProfile(),
            newProfileId = profileManager.getNewProfileName(),
            activeProfiles = globalSettingsDb.getData("./profiles/activeProfiles");

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
            globalSettingsDb.push("/profiles/activeProfiles", activeProfiles);

            // Update loggedInProfile
            globalSettingsDb.push("./profiles/loggedInProfile", newProfileId);

            // Let our logger know we successfully deleted a profile.
            logger.warn(`Successfully renamed profile "${currentProfileId}" to "${newProfileId}"`);
        }
    } catch (err) {
        logger.error("error while renaming profile!", err);
        return;
    }
}

function handleProfileDeletion() {
    const globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings");

    let deletedProfile, activeProfiles;
    try {
        deletedProfile = globalSettingsDb.getData("./profiles/deleteProfile");
        activeProfiles = globalSettingsDb.getData("./profiles/activeProfiles");
    } catch (error) {
        if (error.name === 'DatabaseError') {
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
            globalSettingsDb.push("/profiles/activeProfiles", activeProfiles);
        }

        // Remove loggedInProfile setting and let restart process handle it.
        if (activeProfiles.length > 0 && activeProfiles != null) {
            // Switch to whatever the first profile is in our new active profiles list.
            globalSettingsDb.push("./profiles/loggedInProfile", activeProfiles[0]);
        } else {
            // We have no more active profiles, delete the loggedInProfile setting.
            globalSettingsDb.delete("./profiles/loggedInProfile");
        }

        // Reset the deleteProfile setting.
        globalSettingsDb.delete("./profiles/deleteProfile");

        // Let our logger know we successfully deleted a profile.
        logger.warn(`Successfully deleted profile: ${deletedProfile}`);

    } catch (err) {
        logger.error("error while deleting profile: ", err);
        return;
    }
}

exports.handleProfileRename = handleProfileRename;
exports.handleProfileDeletion = handleProfileDeletion;