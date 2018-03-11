'use strict';

const {app} = require('electron');
const dataAccess = require('./data-access.js');
const logger = require('../logwrapper');

// Cached Items
let loggedInUser = null;

// This app will active a new profile. It will set the loggedInProfile setting in globalsettings and then restart the app.
function logInProfile(profileId) {
    let globalSettingsDb = dataAccess.getJsonDbInUserData('./global-settings');
    globalSettingsDb.push('./profiles/loggedInProfile', profileId);

    app.relaunch();
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
        console.log('No active profiles found while creating a new profile. Creating profile 1.');
        profileId = [1];
    }

    // Get next profile id and push to active profiles.
    activeProfiles.push(profileId);

    // Create the profiles folder if it doesn't exist. It's required
    // for the folders below that are within it
    if (!dataAccess.userDataPathExistsSync("/profiles")) {
        console.info("Can't find the profiles folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles");
    }

    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId)) {
        console.info("Can't find a specific profile folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId);
    }

    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/hotkeys.json")) {
        console.info("Can't find the hotkeys file, creating the default one now...");
        dataAccess.copyDefaultConfigToUserData("hotkeys.json", "/profiles/" + profileId);
    }

    // Create the scripts folder if it doesn't exist
    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/scripts")) {
        console.info("Can't find the scripts folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/scripts");
    }

    // Create the scripts folder if it doesn't exist
    if (!dataAccess.userDataPathExistsSync("/profies/" + profileId + "/backups")) {
        console.info("Can't find the backup folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/backups");
    }

    // Create the controls folder if it doesn't exist.
    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/controls")) {
        console.info("Can't find the controls folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/controls");
    }

    // Create the logs folder if it doesn't exist.
    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/logs")) {
        console.info("Can't find the logs folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/logs");
    }

    // Create the chat folder if it doesn't exist.
    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/chat")) {
        console.info("Can't find the chat folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/chat");
    }

    // Create the chat folder if it doesn't exist.
    if (!dataAccess.userDataPathExistsSync("/profiles/" + profileId + "/live-events")) {
        console.info("Can't find the live-events folder, creating one now...");
        dataAccess.makeDirInUserDataSync("/profiles/" + profileId + "/live-events");
    }

    // Push our new profile to settings.
    console.log(activeProfiles);
    globalSettingsDb.push('/profiles/activeProfiles', activeProfiles);
    console.info('New profile created: ' + profileId + '. Restarting.');

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
        console.info('Setting logged in user cache.');
        return loggedInUser;
    } catch (err) {
        // We dont have a value in our global settings. So, lets try some other things.
        try {
            let globalSettingsDb = dataAccess.getJsonDbInUserData('./global-settings'),
                activeProfiles = globalSettingsDb.getData('./activeProfiles');

            console.log('No logged in profile in global settings file. Attempting to set one and restart the app.');
            logInProfile(activeProfiles[0]);
        } catch (err) {
            // We don't have any profiles at all. Let's make one.
            createNewProfile();
        }
    }
}

exports.getLoggedInProfile = getLoggedInProfile;
exports.createNewProfile = createNewProfile;