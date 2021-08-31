"use strict";

const { app } = require("electron");
const JsonDB = require("node-json-db");
const path = require("path");
const dataAccess = require("./data-access.js");
const logger = require("../logwrapper");
const sanitizeFileName = require("sanitize-filename");

// Cached Items
let loggedInUser = null;


let profileToRename = null;


function restartApp() {
    setTimeout(() => {
        app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
        app.exit(0);
    }, 100);
}

// This app will active a new profile. It will set the loggedInProfile setting in globalsettings and then restart the app.
function logInProfile(profileId) {
    logger.info("Logging in to profile #" + profileId + ". Restarting now.");
    let globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings");
    globalSettingsDb.push("./profiles/loggedInProfile", profileId);

    restartApp();
}

// This function creates a new user profile.
function createNewProfile(profileId) {
    let globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings"),
        activeProfiles = [];

    if (profileId == null || profileId === "") {
        profileId = "Main";
    } else {
        profileId = sanitizeFileName(profileId);
    }

    // Get our active profiles
    try {
    // This means we have "Active" profiles that are being used.
        activeProfiles = globalSettingsDb.getData("./profiles/activeProfiles");
    } catch (err) {
        // This means either all profiles have been deleted, or this is our first launch.
        logger.log("No active profiles found while creating a new profile.");
    }

    let counter = 1;
    while (activeProfiles.includes(profileId)) {
        profileId = `${profileId}${counter}`;
        counter++;
    }

    // Get next profile id and push to active profiles.
    activeProfiles.push(profileId);

    // Push our new profile to settings.
    globalSettingsDb.push("/profiles/activeProfiles", activeProfiles);
    globalSettingsDb.push("/profiles/loggedInProfile", profileId);
    logger.info("New profile created: " + profileId + ". Restarting.");

    // Log the new profile in and restart app.
    logInProfile(profileId);
}

// This function gets the current logged in user information.
function getLoggedInProfile() {
    // We have a cached logged in user, return it.
    if (loggedInUser != null) {
        return loggedInUser;
    }

    // Otherwise, let's get it from the global settings file.
    try {
        // We have a value in global settings! Set it to our cache, then return.
        let globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings");
        loggedInUser = globalSettingsDb.getData("./profiles/loggedInProfile");
        if (loggedInUser != null) {
            logger.info("Setting logged in user cache.");
            return loggedInUser;
        }
    } catch (err) {
        // We dont have a value in our global settings. So, lets try some other things.
        try {
            let globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings"),
                activeProfiles = globalSettingsDb.getData("./activeProfiles");

            logger.log("No logged in profile in global settings file. Attempting to set one and restart the app.");
            logInProfile(activeProfiles[0]);
        } catch (err) {
            // We don't have any profiles at all. Let's make one.
            createNewProfile();
        }
    }
}

function renameProfile(newProfileId) {
    let profileId = getLoggedInProfile();
    logger.warn("User wants to rename profile: " + profileId + ". Restarting the app.");

    let sanitizedNewProfileId = sanitizeFileName(newProfileId);
    if (sanitizedNewProfileId == null || sanitizedNewProfileId === "") {
        logger.error("Attempted to rename profile to an invalid name: " + newProfileId);
        return;
    }

    // Get our active profiles
    let activeProfiles = [];
    try {
        // This means we have "Active" profiles that are being used.
        let globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings");
        activeProfiles = globalSettingsDb.getData("./profiles/activeProfiles");
    } catch (err) {
        logger.debug("No active profiles found");
    }

    let counter = 1;
    while (activeProfiles.includes(sanitizedNewProfileId)) {
        sanitizedNewProfileId = `${sanitizedNewProfileId}${counter}`;
        counter++;
    }

    profileToRename = sanitizedNewProfileId;

    // Restart the app.
    restartApp();
}

// This will mark a profile for deletion on next restart.
// We can't delete a profile while the app is running (and using the files), so we'll delete it while launching next time.
function deleteProfile() {
    let profileId = getLoggedInProfile();
    logger.warn("User wants to delete profile: " + profileId + ". Restarting the app.");

    // Lets set this profile to be deleted on restart. (When no files are in use).
    let globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings");
    globalSettingsDb.push("./profiles/deleteProfile", profileId);

    // Restart the app.
    restartApp();
}

let getPathInProfile = function(filepath) {
    let profilePath =
    dataAccess.getUserDataPath() + "/profiles/" + getLoggedInProfile();
    return path.join(profilePath, filepath);
};

/**
 * @returns JsonDB
 */
let getJsonDbInProfile = function(filepath, humanReadable = true) {
    let profilePath =
      dataAccess.getUserDataPath() + "/profiles/" + getLoggedInProfile(),
        jsonDbPath = path.join(profilePath, filepath);
    return new JsonDB(jsonDbPath, true, humanReadable);
};

let profileDataPathExistsSync = function(filePath) {
    let profilePath = "/profiles/" + getLoggedInProfile(),
        joinedPath = path.join(profilePath, filePath);
    return dataAccess.userDataPathExistsSync(joinedPath);
};

exports.getLoggedInProfile = getLoggedInProfile;
exports.createNewProfile = createNewProfile;
exports.getPathInProfile = getPathInProfile;
exports.getJsonDbInProfile = getJsonDbInProfile;
exports.profileDataPathExistsSync = profileDataPathExistsSync;
exports.deleteProfile = deleteProfile;
exports.logInProfile = logInProfile;
exports.renameProfile = renameProfile;
exports.getNewProfileName = () => profileToRename;
exports.hasProfileRename = () => profileToRename != null;
