"use strict";

const { ipcMain } = require("electron");
const settings = require("../../common/settings-access").settings;
const logger = require("../../logwrapper");
// Active user toggle
let activeUserListStatus = settings.getActiveChatUserListEnabled();

// User Timeout Settings
let userInactiveTimeSetting = settings.getActiveChatUserListTimeout();
let inactiveTimer = userInactiveTimeSetting * 60000;

// Timer and chatter list.
let cycleActiveTimer = [];
let activeChatters = [];

function isUsernameActiveChatter(username = "") {
    const expiredTime = new Date().getTime() - inactiveTimer;
    return activeChatters.some(c => c.username.toLowerCase() === username.toLowerCase()
        && c.time >= expiredTime);
}

async function addOrUpdateActiveChatter(userId, username = "") {
    if (!activeUserListStatus) {
        return;
    }

    const userDatabase = require("../../database/userDatabase");

    // Stop early if user shouldn't be in active chatter list.
    let firebotUser = await userDatabase.getUserByUsername(username);
    if (firebotUser && firebotUser.disableActiveUserList) {
        logger.debug(firebotUser.username + " is set to not join the active viewer list.");
        return;
    }

    // User should be okay, add them!
    let date = new Date;
    let currentTime = date.getTime();

    let existingUserIndex = activeChatters.findIndex(obj => obj.userId === userId);

    // If user exists, update their time and stop.
    if (existingUserIndex !== -1) {
        logger.debug(username + " is still active in chat. Updating their time.");
        activeChatters[existingUserIndex].time = currentTime;
        return;
    }

    // Else, we're going to push the new user to the active chatter array.
    logger.debug(username + " has become active in chat. Adding them to active chatter list.");
    const user = {
        userId: userId,
        username: username,
        time: currentTime
    };
    activeChatters.push(user);
}

function clearInactiveChatters() {
    logger.debug("Clearing inactive people from active chatters list.");
    let expiredTime = new Date().getTime() - inactiveTimer;
    activeChatters = activeChatters.filter(u => u != null && u.time >= expiredTime);
}

async function removeUserFromList(userId) {
    activeChatters = activeChatters.filter(u => u != null && u.userId !== userId);
}

async function clearList() {
    activeChatters = [];
}

function getActiveChatters() {
    return activeChatters;
}

function cycleActiveChatters() {
    const twitchChat = require("../../chat/twitch-chat");
    let chatConnected = twitchChat.chatIsConnected();
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