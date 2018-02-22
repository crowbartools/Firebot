'use strict';
const mixerInteractive = require('../common/mixer-interactive.js');
const mixerChat = require('../common/mixer-chat.js');
const dataAccess = require('../common/data-access.js');
const groupsAccess = require('../common/groups-access');
const NodeCache = require('node-cache');
const logger = require('../logwrapper');

let streamerName = false;

const permissionCache = new NodeCache({ stdTTL: 10, checkperiod: 120 });

// This checks to see if the user is in a specific role.
function userIsInRole(userRoles, approvedRoles) {
    if (approvedRoles == null || approvedRoles.length === 0) {
        return true;
    }

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
        case "Channel Editors":
            return "ChannelEditor";
        case "Streamer":
            return "Owner";
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

            let cachedPermissions = permissionCache.get(participant.userID);
            if (cachedPermissions != null) {
                resolve(cachedPermissions.roles);
                return;
            }

            mixerChat.getUser(participant.userID, r => {
                let roles = [];

                if (r != null) {
                    roles = r.body.userRoles;
                }

                permissionCache.set(participant.userID, {roles: roles});

                resolve(roles);
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

            // Temp: Can remove undefined or null checks after a few updates.
            if (control.permissionType === "Group" || control.permissionType == null) {

                // This is an array, so we're testing against user groups.
                getUserRoles(participant)
                    .then((userRoles) => {

                        // Do we have permissions to check against in this array?
                        let userHasPermission;
                        if (control.permissions instanceof Array) {
                            // We have some permissions to check against. So, lets see if any of them match the user.
                            userHasPermission = userIsInRole(getCombinedRoles(participant.username, userRoles), mapRoleNames(control.permissions));
                        } else {
                            // No permissions to check against.
                            userHasPermission = true;
                        }

                        // Okay, lets try to run the command.
                        if (!userHasPermission && participant.username !== streamerName) {
                            mixerChat.whisper('bot', participant.username, "You do not have permission to use the " + control.text + ' button!');
                            renderWindow.webContents.send('eventlog', {type: "general", username: participant.username, event: "pressed the " + control.controlId + " button, but does not have permission."});
                            reject('User does not have permission.');
                        } else {
                            resolve();
                        }

                    })
                    .catch((err) => {
                        logger.error(err);
                        renderWindow.webContents.send('error', "There was an error trying to get user roles from chat for button permissions." + err);
                        reject('Cant get user roles.');
                    });
            } else if (control.permissionType === "Individual") {
                if (control.permissions === participant.username || control.permissions === "") {
                    // This individual has permission to use this.
                    resolve();
                } else {
                    // This is set to individual permission, but usernames dont match.
                    mixerChat.whisper('bot', participant.username, "You do not have permission to use the " + control.text + ' button!');
                    renderWindow.webContents.send('eventlog', {type: "general", username: participant.username, event: "pressed the " + control.controlId + " button, but does not have permission."});
                    reject('User does not have permission.');
                }
            } else {
                logger.error('Unknown error while checking interactive permissions.');
                reject('Something happened while checking permissions.');
            }
        } else {
            resolve('Either we are not connected or this button has no permissions. Skipping check.');
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