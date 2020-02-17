"use strict";

const { ipcMain } = require("electron");
const settings = require("../../common/settings-access").settings;
const logger = require("../../logwrapper");
const userDatabase = require("../../database/userDatabase");
const Mixplay = require("../../interactive/mixplay");

// Active user toggle
let activeUserListStatus = settings.getActiveMixplayUserList() === false ? false : true;

// User Timeout Settings
let userInactiveTimeSetting = settings.getActiveMixplayUserListTimeout() != null ? settings.getActiveMixplayUserListTimeout() : 10;
let inactiveTimer = userInactiveTimeSetting * 60000;

// Timer and chatter list.
let cycleActiveTimer = [];
let activeMixplayUsers = [];

function isUsernameActiveUser(username) {
    let existingUserIndex = activeMixplayUsers.findIndex((obj => obj.username === username));
    if (existingUserIndex !== -1) {
        return true;
    }
    return false;
}

async function addOrUpdateActiveUser(user) {
    if (!activeUserListStatus) {
        return;
    }

    // Stop early if user shouldn't be in active chatter list.
    let userDB = await userDatabase.getUserByUsername(user.user_name);
    if (userDB.disableActiveUserList) {
        logger.debug(userDB.username + " is set to not join the active mixplay user list.");
        return;
    }

    // User should be okay, add them!
    let date = new Date;
    let currentTime = date.getTime();

    let existingUserIndex = activeMixplayUsers.findIndex((obj => obj.userId === user.user_id));

    // If user exists, update their time and stop.
    if (existingUserIndex !== -1) {
        logger.debug(user.user_name + " is still active in mixplay. Updating their time.");
        activeMixplayUsers[existingUserIndex].time = currentTime;
        return;
    }

    // Else, we're going to push the new user to the active array.
    logger.debug(user.user_name + " has become active on mixplay. Adding them to active mixplay list.");
    user = {
        userId: user.user_id,
        username: user.user_name,
        time: currentTime
    };
    activeMixplayUsers.push(user);
}

function removeLeavingUser(username) {
    for (let userIndex in activeMixplayUsers) {
        if (activeMixplayUsers[userIndex] != null) {
            let user = activeMixplayUsers[userIndex];
            if (user.username === username) {
                logger.debug(user.username + " has left mixplay. Removing from active mixplay list.");
                activeMixplayUsers.splice(userIndex, 1);
            }
        }
    }
}

function clearInactiveUsers() {
    logger.debug("Clearing inactive people from active mixplay users list.");
    let date = new Date;
    let currentTime = date.getTime();
    let expiredTime = currentTime - inactiveTimer;
    for (let userIndex in activeMixplayUsers) {
        if (activeMixplayUsers[userIndex] != null) {
            let user = activeMixplayUsers[userIndex];
            if (user.time <= expiredTime) {
                logger.debug(user.username + " has gone inactive on mixplay. Removing them from active mixplay list.");
                activeMixplayUsers.splice(userIndex, 1);
            }
        }
    }
}

function getActiveMixplayUsers() {
    return activeMixplayUsers;
}

function cycleActiveMixplayUsers() {
    let mixplayConnected = Mixplay.mixplayIsConnected;
    if (!mixplayConnected) {
        return;
    }

    logger.info("Starting Active Mixplay Users Loop");

    // Just in case
    clearInterval(cycleActiveTimer);

    // We have permission to start up the loop now. Let's do this...
    cycleActiveTimer = setInterval(function() {
        clearInactiveUsers();
    }, 60000);

    return;
}

ipcMain.on("setActiveMixplayUsers", function(event, value) {
    logger.debug('Changing active mixplay user enabled to: ' + value);
    if (value === false) {
        logger.debug('Stopping active mixplay user timeout cycle.');
        clearInterval(cycleActiveTimer);
    }
    activeUserListStatus = settings.getActiveMixplayUserList() === false ? false : true;
});

ipcMain.on("setActiveMixplayUserTimeout", function(event, value) {
    logger.debug('Changing active mixplay user timeout to: ' + value);

    // Make sure we have a valid value, then set it.
    value = parseInt(inactiveTimer);
    if (isNaN(value)) {
        return 10;
    }
    inactiveTimer = value;

    // Restart our timer with the new value.
    cycleActiveMixplayUsers();
});

// Export Functions
exports.getActiveMixplayUsers = getActiveMixplayUsers;
exports.addOrUpdateActiveUser = addOrUpdateActiveUser;
exports.cycleActiveMixplayUsers = cycleActiveMixplayUsers;
exports.isUsernameActiveUser = isUsernameActiveUser;
exports.removeLeavingUser = removeLeavingUser;