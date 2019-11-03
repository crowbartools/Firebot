"use strict";

const logger = require("../logwrapper");

// User Settings
let inactiveTimer = 10 * 60000; // 10 minutes default

// Timer and chatter list.
let cycleActiveTimer = [];
let activeChatters = [];

function addOrUpdateActiveChatter(user) {
    let date = new Date;
    let currentTime = date.getTime();

    let existingUserIndex = activeChatters.findIndex((obj => obj.userId === user.user_id));

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
    let date = new Date;
    let currentTime = date.getTime();
    let expiredTime = currentTime - inactiveTimer;
    for (let userIndex in activeChatters) {
        if (activeChatters[userIndex] != null) {
            let user = activeChatters[userIndex];
            if (user.time <= expiredTime) {
                logger.debug(user.username + " has gone inactive in chat. Removing them from active chatter list.");
                activeChatters.splice(userIndex, 1);
            }
        }
    }
}

function getActiveChatters() {
    return activeChatters;
}

function cycleActiveChatters() {
    logger.info("Starting Active Chatters Loop");

    // Just in case
    clearInterval(cycleActiveTimer);

    // We have permission to start up the loop now. Let's do this...
    cycleActiveTimer = setInterval(function() {
        clearInactiveChatters();
    }, 60000);

    return;
}

// Export Functions
exports.getActiveChatters = getActiveChatters;
exports.addOrUpdateActiveChatter = addOrUpdateActiveChatter;
exports.cycleActiveChatters = cycleActiveChatters;