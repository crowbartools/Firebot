"use strict";

const { ipcMain } = require("electron");
const settings = require("../../common/settings-access").settings;
const logger = require("../../logwrapper");
const userDatabase = require("../../database/userDatabase");
const chat = require("../../chat/chat");

// Active user toggle
let activeUserListStatus = settings.getActiveChatUserListEnabled();

// User Timeout Settings
let userInactiveTimeSetting = settings.getActiveChatUserListTimeout();
let inactiveTimer = userInactiveTimeSetting * 60000;

// Timer and chatter list.
let cycleActiveTimer = [];
let activeChatters = [];

function isUsernameActiveChatter(username) {
    let existingUserIndex = activeChatters.findIndex((obj => obj.username === username));
    if (existingUserIndex !== -1) {
        return true;
    }
    return false;
}

async function addOrUpdateActiveChatter(user) {
    if (!activeUserListStatus) {
        return;
    }

    // Stop early if user shouldn't be in active chatter list.
    let firebotUser = await userDatabase.getUserByUsername(user.user_name);
    if (firebotUser && firebotUser.disableActiveUserList) {
        logger.debug(firebotUser.username + " is set to not join the active viewer list.");
        return;
    }

    // User should be okay, add them!
    let date = new Date;
    let currentTime = date.getTime();

    let existingUserIndex = activeChatters.findIndex(obj => obj.userId === user.user_id);

    // If user exists, update their time and stop.
    if (existingUserIndex !== -1) {
        logger.debug(user.user_name + " is still active in chat. Updating their time.");
        activeChatters[existingUserIndex].time = currentTime;
        return;
    }

    // Else, we're going to push the new user to the active chatter array.
    logger.debug(user.user_name + " has become active in chat. Adding them to active chatter list.");
    user = {
        userId: user.user_id,
        username: user.user_name,
        time: currentTime
    };
    activeChatters.push(user);
}

function clearInactiveChatters() {
    logger.debug("Clearing inactive people from active chatters list.");
    let expiredTime = new Date().getTime() - inactiveTimer;
    activeChatters = activeChatters.filter(u => u != null && u.time >= expiredTime);
}

async function removeUserFromList(removedUser) {
    activeChatters = activeChatters.filter(u => u != null && u.username !== removedUser.user_name);
}

async function clearList() {
    activeChatters = [];
}

function getActiveChatters() {
    return activeChatters;
}

function cycleActiveChatters() {
    let chatConnected = chat.chatIsConnected();
    if (!chatConnected) {
        return;
    }

    logger.info("Starting Active Chatters Loop");

    // Just in case
    clearInterval(cycleActiveTimer);

    // We have permission to start up the loop now. Let's do this...
    cycleActiveTimer = setInterval(function() {
        clearInactiveChatters();
    }, 60000);

    return;
}

ipcMain.on("setActiveChatUsers", function(event, value) {
    logger.debug('Changing active chat user enabled to: ' + value);
    if (value === false) {
        logger.debug('Stopping active user timeout cycle.');
        clearInterval(cycleActiveTimer);
    }
    activeUserListStatus = settings.getActiveChatUserListEnabled() ? true : false;
});

ipcMain.on("setActiveChatUserTimeout", function(event, value) {
    logger.debug('Changing active chat user timeout to: ' + value);

    // Make sure we have a valid value, then set it.
    if (isNaN(value)) {
        inactiveTimer = 10;
    } else {
        inactiveTimer = parseInt(value);
    }

    // Restart our timer with the new value.
    cycleActiveChatters();
});

// Export Functions
exports.getActiveChatters = getActiveChatters;
exports.addOrUpdateActiveChatter = addOrUpdateActiveChatter;
exports.cycleActiveChatters = cycleActiveChatters;
exports.isUsernameActiveChatter = isUsernameActiveChatter;
exports.removeUserFromList = removeUserFromList;
exports.clearList = clearList;