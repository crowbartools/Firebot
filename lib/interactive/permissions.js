'use strict';
const mixerInteractive = require('../common/mixer-interactive.js');
const mixerChat = require('../common/mixer-chat.js');
const dataAccess = require('../common/data-access.js');
const groupsAccess = require('../common/groups-access');

let streamerName = false;

// This checks to see if the user is in a specific role.
function userIsInRole(userRoles, approvedRoles) {
    let foundMatch = false;
    userRoles.forEach((uRole) => {
        if (approvedRoles.includes(uRole)) {
            foundMatch = true;
        }
    });
    return foundMatch;
}

// This maps the apps role names to actual mixer chat role names.
function mapRoleNames(permissions) {
    return permissions.map((p) => {
        switch (p) {
        case "Moderators":
            return "Mod";
        case "Subscribers":
            return "Subscriber";
        default:
            return p;
        }
    });
}

// Returns an array of all standard roles and viewer groups they're in.
function getCombinedRoles(username, userRoles) {
    let userCustomRoles = groupsAccess.getGroupsForUser(username);
    for (let role in userCustomRoles) {
        if (userCustomRoles.hasOwnProperty(role)) {
            userRoles.push(userCustomRoles[role].groupName);
        }
    }
    return userRoles;
}

// Gets user roles from a participant object.
function getUserRoles(participant) {
    return new Promise((resolve) => {
        if (participant.userID != null) {
            mixerChat.getUser(participant.userID, r => {
                if (r != null) {
                    resolve(r.body.userRoles);
                } else {
                    resolve([]);
                }
            });
        } else {
            resolve([]);
        }
    });
}

// Handles all permission requests
function permissionsRouter(participant, control) {
    return new Promise((resolve, reject) => {

        // We only need to do anything if we're connected to interactive and chat.
        if (mixerInteractive.getInteractiveStatus() === true && mixerChat.getChatStatus() === true && control.permissions != null) {
            getUserRoles(participant)
                .then((userRoles) => {

                    // We have some permissions to check against. So, lets see if any of them match the user.
                    let userHasPermission = userIsInRole(getCombinedRoles(participant.username, userRoles), mapRoleNames(control.permissions));

                    if (!userHasPermission && participant.username !== streamerName) {
                        mixerChat.whisper('bot', participant.username, "You do not have permission to use this button!");
                        renderWindow.webContents.send('eventlog', {username: participant.username, event: "pressed the " + control.controlID + " button, but does not have permission."});
                        reject('User does not have permission.');
                    } else {
                        console.log('User can press the button!');
                        resolve();
                    }

                })
                .catch((err) => {
                    console.log(err);
                    renderWindow.webContents.send('error', "There was an error trying to get user roles from chat for button permissions." + err);
                    reject('Cant get user roles.');
                });
        } else {
            // We're not connected to interactive and chat. So we can't get user roles.
            console.log('Skipping permission check. Either dependencies didnt pass or there are no permissions to check against.');
            reject('Either we are not connected or this button has no permissions. Skipping check.');
        }

    });
}

// Update streamer username
function updateStreamerUsername() {
    let authDb = dataAccess.getJsonDbInUserData('/user-settings/auth');
    streamerName = authDb.getData('/streamer/username');
}

// Exports
exports.router = permissionsRouter;
exports.updateStreamerUsername = updateStreamerUsername;