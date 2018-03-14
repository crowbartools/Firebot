'use strict';

const {app} = require('electron');
const JsonDB = require('node-json-db');
const path = require('path');
const dataAccess = require('./data-access.js');
const logger = require('../logwrapper');

// Cached Items
let loggedInUser = null;

// This app will active a new profile. It will set the loggedInProfile setting in globalsettings and then restart the app.
function logInProfile(profileId) {
    logger.info('User has selected to change to profile ' + profileId + '.');
    let globalSettingsDb = dataAccess.getJsonDbInUserData('./global-settings');
    globalSettingsDb.push('./profiles/loggedInProfile', profileId);

    app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])});
    app.exit(0);
}

// This function creates a new user profile.
function createNewProfile() {
    let globalSettingsDb = dataAccess.getJsonDbInUserData('./global-settings'),
        activeProfiles = [],
        profileId = null;

    try {
        // We have some active profiles, so lets find our next profile number.
        activeProfiles = globalSettingsDb.getData('./profiles/activeProfiles');
        profileId = Math.max.apply(Math, activeProfiles) + 1;
    } catch (err) {
        // No active profiles, so let's just create profile number 1.
        logger.log('No active profiles found while creating a new profile. Creating profile 1.');
        profileId = 1;
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

    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/hotkeys.json")) {
        logger.info("Can't find the hotkeys file, creating the default one now...");
        dataAccess.copyDefaultConfigToUserData("hotkeys.json", "/profiles/" + profileId);
    }

    // Create the scripts folder if it doesn't exist
    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/scripts")) {
        logger.info("Can't find the scripts folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/scripts");
    }

    // Create the scripts folder if it doesn't exist
    if (!dataAccess.userDataPathExistsSync("/profies/" + profileId + "/backups")) {
        logger.info("Can't find the backup folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/backups");
    }

    // Create the controls folder if it doesn't exist.
    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/controls")) {
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
    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/live-events")) {
        logger.info("Can't find the live-events folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/live-events");
    }

    // Push our new profile to settings.
    logger.log(activeProfiles);
    globalSettingsDb.push('/profiles/activeProfiles', activeProfiles);
    globalSettingsDb.push('/profiles/loggedInProfile', profileId);
    logger.info('New profile created: ' + profileId + '. Restarting.');

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
        let globalSettingsDb = dataAccess.getJsonDbInUserData('./global-settings');
        loggedInUser = globalSettingsDb.getData('./profiles/loggedInProfile');
        if (loggedInUser != null) {
            logger.info('Setting logged in user cache.');
            return loggedInUser;
        }
    } catch (err) {
        // We dont have a value in our global settings. So, lets try some other things.
        try {
            let globalSettingsDb = dataAccess.getJsonDbInUserData('./global-settings'),
                activeProfiles = globalSettingsDb.getData('./activeProfiles');

            logger.log('No logged in profile in global settings file. Attempting to set one and restart the app.');
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
    logger.warn('User wants to delete profile: ' + profileId + '. Restarting the app.');

    // Lets set this profile to be deleted on restart. (When no files are in use).
    let globalSettingsDb = dataAccess.getJsonDbInUserData('./global-settings');
    globalSettingsDb.push('./profiles/deleteProfile', profileId);

    // Restart the app.
    app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])});
    app.exit(0);
}

let getPathInProfile = function(filepath) {
    let profilePath = dataAccess.getUserDataPath() + '/profiles/' + getLoggedInProfile();
    return path.join(profilePath, filepath);
};

let getJsonDbInProfile = function(filepath) {
    let profilePath = dataAccess.getUserDataPath() + '/profiles/' + getLoggedInProfile(),
        jsonDbPath = path.join(profilePath, filepath);
    return new JsonDB(jsonDbPath, true, true);
};

let profileDataPathExistsSync = function(filePath) {
    let profilePath = dataAccess.getUserDataPath() + '/profiles/' + getLoggedInProfile(),
        joinedPath = path.join(profilePath, filePath);
    return dataAccess.pathExistsSync(joinedPath);
};

let getStreamerUsername = function() {
    let streamer;

    try {
        let authDb = getJsonDbInProfile('/auth');
        streamer = authDb.getData('/streamer/username');
    } catch (err) {
        streamer = "Unknown Streamer";
    }

    return streamer;
};

exports.getLoggedInProfile = getLoggedInProfile;
exports.createNewProfile = createNewProfile;
exports.getStreamerUsername = getStreamerUsername;
exports.getPathInProfile = getPathInProfile;
exports.getJsonDbInProfile = getJsonDbInProfile;
exports.profileDataPathExistsSync = profileDataPathExistsSync;
exports.deleteProfile = deleteProfile;
exports.logInProfile = logInProfile;
