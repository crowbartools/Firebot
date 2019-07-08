"use strict";

const { app } = require("electron");
const JsonDB = require("node-json-db");
const path = require("path");
const dataAccess = require("./data-access.js");
const logger = require("../logwrapper");

// Cached Items
let loggedInUser = null;

// This app will active a new profile. It will set the loggedInProfile setting in globalsettings and then restart the app.
function logInProfile(profileId) {
    logger.info("Logging in to profile #" + profileId + ". Restarting now.");
    let globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings");
    globalSettingsDb.push("./profiles/loggedInProfile", profileId);

    app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
    app.exit(0);
}

// This function creates a new user profile.
function createNewProfile() {
    let globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings"),
        profileId = 1,
        activeProfiles = [];

    // Get the number for our next profile.
    try {
    // This means we've built profiles before. So increment the number by one.
        profileId = globalSettingsDb.getData("./profiles/profileCounter") + 1;
    } catch (err) {
    // This means this is our first launch or we lost track of our profile count. Start over with 1.
        logger.log(
            "Total profiles doesnt exist. Either this is a new launch or we lost our global settings file."
        );
    }

    // Get our active profiles
    try {
    // This means we have "Active" profiles that are being used.
        activeProfiles = globalSettingsDb.getData("./profiles/activeProfiles");
    } catch (err) {
    // This means either all profiles have been deleted, or this is our first launch.
        logger.log("No active profiles found while creating a new profile.");
    }

    // Get next profile id and push to active profiles.
    activeProfiles.push(profileId);

    // Create the profiles folder if it doesn't exist. It's required
    // for the folders below that are within it
    if (!dataAccess.userDataPathExistsSync("/profiles")) {
        logger.info("Can't find the profiles folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles");
    }

    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId)) {
        logger.info("Can't find a specific profile folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId);
    }

    if (
        !dataAccess.userDataPathExistsSync(
            "/profiles/" + profileId + "/hotkeys.json"
        )
    ) {
        logger.info("Can't find the hotkeys file, creating the default one now...");
        dataAccess.copyDefaultConfigToUserData(
            "hotkeys.json",
            "/profiles/" + profileId
        );
    }

    // Create the scripts folder if it doesn't exist
    if (
        !dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/scripts")
    ) {
        logger.info("Can't find the scripts folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/scripts");
    }

    // Create the controls folder if it doesn't exist.
    if (
        !dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/controls")
    ) {
        logger.info("Can't find the controls folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/controls");
    }

    // Create the logs folder if it doesn't exist.
    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/logs")) {
        logger.info("Can't find the logs folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/logs");
    }

    // Create the chat folder if it doesn't exist.
    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/chat")) {
        logger.info("Can't find the chat folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/chat");
    }

    // Create the chat folder if it doesn't exist.
    if (
        !dataAccess.userDataPathExistsSync(
            "/profiles/" + profileId + "/live-events"
        )
    ) {
        logger.info("Can't find the live-events folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/live-events");
    }

    // Push our new profile to settings.
    globalSettingsDb.push("./profiles/profileCounter", profileId);
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
            let globalSettingsDb = dataAccess.getJsonDbInUserData(
                    "./global-settings"
                ),
                activeProfiles = globalSettingsDb.getData("./activeProfiles");

            logger.log(
                "No logged in profile in global settings file. Attempting to set one and restart the app."
            );
            logInProfile(activeProfiles[0]);
        } catch (err) {
            // We don't have any profiles at all. Let's make one.
            createNewProfile();
        }
    }
}

// This will mark a profile for deletion on next restart.
// We can't delete a profile while the app is running (and using the files), so we'll delete it while launching next time.
function deleteProfile() {
    let profileId = getLoggedInProfile();
    logger.warn(
        "User wants to delete profile: " + profileId + ". Restarting the app."
    );

    // Lets set this profile to be deleted on restart. (When no files are in use).
    let globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings");
    globalSettingsDb.push("./profiles/deleteProfile", profileId);

    // Restart the app.
    app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
    app.exit(0);
}

let getPathInProfile = function(filepath) {
    let profilePath =
    dataAccess.getUserDataPath() + "/profiles/" + getLoggedInProfile();
    return path.join(profilePath, filepath);
};

let getJsonDbInProfile = function(filepath) {
    let profilePath =
      dataAccess.getUserDataPath() + "/profiles/" + getLoggedInProfile(),
        jsonDbPath = path.join(profilePath, filepath);
    return new JsonDB(jsonDbPath, true, true);
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
