"use strict";

const { ipcMain } = require("electron");
const settings = require("../../common/settings-access").settings;
const logger = require("../../logwrapper");
const userDatabase = require("../../database/userDatabase");
const Mixplay = require("../../interactive/mixplay");

// Active user toggle
let activeUserListStatus = settings.getActiveMixplayUserListEnabled();

// User Timeout Settings
let userInactiveTimeSetting = settings.getActiveMixplayUserListTimeout();
let inactiveTimer = userInactiveTimeSetting * 60000;

// Timer and chatter list.
let cycleActiveTimer = [];
let activeMixplayUsers = [];

function isUsernameActiveUser(username) {
    return activeMixplayUsers.some(u => u.username === username);
}

async function addOrUpdateActiveUser(user) {
    if (!activeUserListStatus) {
        return;
    }

    // Stop early if user shouldn't be in active chatter list.
    let userDB = await userDatabase.getUserByUsername(user.username);

    if (userDB && userDB.disableActiveUserList) {
        logger.debug(userDB.username + " is set to not join the active mixplay user list.");
        return;
    }

    // User should be okay, add them!
    let date = new Date;
    let currentTime = date.getTime();

    let existingUserIndex = activeMixplayUsers.findIndex(obj => obj.userId === user.userID);

    // If user exists, update their time and stop.
    if (existingUserIndex !== -1) {
        logger.debug(user.username + " is still active in mixplay. Updating their time.");
        activeMixplayUsers[existingUserIndex].time = currentTime;
        return;
    }

    // Else, we're going to push the new user to the active array.
    logger.debug(user.username + " has become active on mixplay. Adding them to active mixplay list.");
    user = {
        userId: user.userID,
        username: user.username,
        time: currentTime
    };
    activeMixplayUsers.push(user);
}

function clearInactiveUsers() {
    logger.debug("Clearing inactive people from active mixplay users list.");
    let expiredTime = new Date().getTime() - inactiveTimer;
    activeMixplayUsers = activeMixplayUsers.filter(u => u != null && u.time >= expiredTime);
}

async function removeUserFromList(removedUser) {
    activeMixplayUsers = activeMixplayUsers.filter(u => u != null && u.username !== removedUser.username);
}

async function clearList() {
    activeMixplayUsers = [];
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
    activeUserListStatus = settings.getActiveMixplayUserListEnabled() ? true : false;
});

ipcMain.on("setActiveMixplayUserTimeout", function(event, value) {
    logger.debug('Changing active mixplay user timeout to: ' + value);

    // Make sure we have a valid value, then set it.
    if (isNaN(value)) {
        inactiveTimer = 10;
    } else {
        inactiveTimer = parseInt(value);
    }

    // Restart our timer with the new value.
    cycleActiveMixplayUsers();
});

// Export Functions
exports.getActiveMixplayUsers = getActiveMixplayUsers;
exports.addOrUpdateActiveUser = addOrUpdateActiveUser;
exports.cycleActiveMixplayUsers = cycleActiveMixplayUsers;
exports.isUsernameActiveUser = isUsernameActiveUser;
exports.removeUserFromList = removeUserFromList;
exports.clearList = clearList;