'use strict';

const Chat = require('../common/mixer-chat');
const Interactive = require('../common/mixer-interactive');
const dataAccess = require('../common/data-access.js');
const logger = require('../logwrapper');

let groupWaitList = [];
let groupQueueInterval = null;

// User Queue
// This takes usernames when they connect to interactive and puts them in a queue to be processed when we have api calls available.
function groupQueue(participant) {
    let username = participant.username;
    let userID = participant.userID;

    groupWaitList.push({username: username, userid: userID, participant: participant});
}

// Remove User
// This will remove a user from the wait list.
function removeUserQueue(username) {
    let user;
    for (user of groupWaitList) {
        user = user.username;
        if (user === username) {
            if (groupWaitList.indexOf(user) > -1) {
                let index = groupWaitList.indexOf(user);
                groupWaitList.splice(index, 1);
            }
        }
    }
}

// Clear User queue
// This will be used by the disconnect function to clear the wait list.
function clearGroupQueue() {
    groupWaitList = [];
}

// Connection Checker
// This checks to see if both chat and interactive are connected.
function connectionChecker () {
    let chat = Chat.getChatStatus();
    let interactive = Interactive.getInteractiveStatus();

    if (chat && interactive) {
        return true;
    }
    return false;

}

// Auto Group
// This function automatically groups new users as they connect.
// User must be connected to chat to be grouped.
function autoGroup(groupList, username, userid, participant) {

    // Set user to NOT grouped. This will be flipped once they are grouped.
    let isUserGrouped = false;

    try {
        // See if username matches a custom group, if it does put them in there and then end. Else keep going.
        for (let item of groupList.customGroups) {
            try {
                let dbGroups = dataAccess.getJsonDbInUserData("/user-settings/groups");
                let groupJson = dbGroups.getData('./' + item + '/users');

                for (let user of groupJson) {
                    if (username.toLowerCase() === user.toLowerCase()) {
                        // Move this person to to whatever group we are in now.
                        Interactive.changeGroups(participant, item);

                        // Log Event
                        renderWindow.webContents.send('eventlog', {type: "general", username: username, event: "was placed into the " + item + " group."});

                        // Set is grouped to true so we can skip an API call.
                        isUserGrouped = true;
                        break;
                    }
                }
            } catch (err) {
                logger.debug("error while attempting to auto group", err);
            }
        }

        // Get user from chat (user roles are not sent via interactive). This is done via a function in mixer-chat.js
        if (isUserGrouped === false) {
            Chat.getUser(userid, function(response) {

                // Get user roles
                response = response.body;

                if (!response.userRoles) return;
                let mainGroup = response.userRoles[0];

                logger.debug(`Attempting to autogroup the user '${username}'. They are in the groups: '${response.userRoles.join(",")}', their first group is: '${mainGroup}'`);
                logger.debug(`active groups: `, groupList);

                // See if we can match up any roles to the groups that are in use.
                if (mainGroup === "Staff" && groupList.staffGroup === true) {
                    // User is a staff member and staff group is active.
                    Interactive.changeGroups(participant, "Staff");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {type: "general", username: username, event: "was placed into the Staff group."});
                } else if (mainGroup === "Owner" && groupList.streamerGroup === true) {
                    // User is the channel owner and streamer group is active.
                    Interactive.changeGroups(participant, "Streamer");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {type: "general", username: username, event: "was placed into the Streamer group."});
                } else if (mainGroup === "ChannelEditor" && groupList.editorGroup === true) {
                    // User is a channel editor and editor group is active.
                    Interactive.changeGroups(participant, "Channel Editors");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {type: "general", username: username, event: "was placed into the Channel Editors group."});
                } else if (mainGroup === "Mod" && groupList.modGroup === true) {
                    // User is a moderator and mod group is active.
                    Interactive.changeGroups(participant, "Moderators");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {type: "general", username: username, event: "was placed into the Moderator group."});
                } else if (mainGroup === "Subscriber" && groupList.subGroup === true) {
                    // User is a subscriber and sub group is active.
                    Interactive.changeGroups(participant, "Subscribers");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {type: "general", username: username, event: "was placed into the Subscriber group."});
                } else if (mainGroup === "Pro" && groupList.proGroup === true) {
                    // User is a pro and pro group is active.
                    Interactive.changeGroups(participant, "Pro");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {type: "general", username: username, event: "was placed into the Pro group."});
                } else {
                    renderWindow.webContents.send('eventlog', {type: "general", username: username, event: "will remain in the default group."});
                }

                isUserGrouped = true; // Set this to true here no matter what. Now they HAVE to be grouped somehow.
            });
        }

        // Cut person out of queue.
        groupWaitList.splice(0, 1);

    } catch (err) {
        logger.error("error while attempting to autogroup2", err);
    }
}

// Queue Stopper
// This stops the groupQueueChecker
function groupQueueStop() {
    if (groupQueueInterval !== null && groupQueueInterval !== undefined) {
        logger.info('Stopping autogroup queue.');
        clearInterval(groupQueueInterval);
        clearGroupQueue();
    }
}

// Chat API Checker
// This is where we check to see if auto grouper should keep going.
function chatAPIChecker(groupList) {
    // See if anyone is in queue.
    if (groupWaitList.length > 0) {

        // We have people waiting! Check to see if we're still connected to both chat and interactive.
        let user = groupWaitList[0];
        if (connectionChecker()) {
            autoGroup(groupList, user.username, user.userid, user.participant);
        } else {
            // We lost connection to interactive or chat. Stop auto grouping.
            renderWindow.webContents.send('eventlog', {type: "general", username: "System:", event: "Interactive auto grouping stopped. Please connect to both chat and interactive to restart."});
            groupQueueStop();
        }

    } else {
        // No users left in the queue.
        return;
    }
}

// Group Checker
// This function checks to see which groups are in use at this time.
function groupChecker() {

    // Default group object.
    let groupObject = {
        proGroup: false,
        subGroup: false,
        modGroup: false,
        staffGroup: false,
        customGroups: ['banned']
    };

    // Build object that shows which groups are in use currently.
    try {
        // Get last board name.
        let dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
        let gameName = dbSettings.getData('/interactive/lastBoardId');

        // Get settings for last board.
        let dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/" + gameName);
        let gameScenes = dbControls.getData('./firebot/scenes');


        // Loop through scenes to see which groups are in use.
        logger.debug("Checking scenes for assigned groups...");
        for (let scene in gameScenes) {
            if (scene !== null && scene !== undefined) {
                scene = gameScenes[scene];
                let groupList = scene.default;

                logger.debug(`Checking scene '${scene.sceneName}', which has these groups assigned:`, groupList);

                // Loop through group list and push results to groups..
                // After this we will know which groups are in use currently and which are not.
                for (let item of groupList) {
                    switch (item) {
                    case "Pro":
                        groupObject.proGroup = true;
                        break;
                    case "Subscribers":
                        groupObject.subGroup = true;
                        break;
                    case "Moderators":
                        groupObject.modGroup = true;
                        break;
                    case "Channel Editors":
                        groupObject.editorGroup = true;
                        break;
                    case "Staff":
                        groupObject.staffGroup = true;
                        break;
                    case "Streamer":
                        groupObject.streamerGroup = true;
                        break;
                    default:
                        if (item !== "None") {
                            groupObject.customGroups.push(item);
                        }
                    }
                }
            }
        }

        // If any of the auto group items are true then return the group object.
        for (let i in groupObject) {
            if (groupObject[i] === true) {
                return groupObject;
            }
        }

        // If custom groups has any item other than banned return the group object.
        for (let i of groupObject.customGroups) {
            if (i !== "banned") {
                return groupObject;
            }
        }

        // Otherwise, user is not using any auto group roles or custom groups.
        return false;

    } catch (err) {
        logger.warn(err);
    }
}

// Queue Checker
// This starts checking to see if anyone is in the user queue.
function groupQueueStart() {
    let groupList = groupChecker();
    if (groupList !== false && connectionChecker()) {
        logger.info('User groups detected. Starting Auto Grouper.');
        renderWindow.webContents.send('eventlog', {type: "general", username: "System:", event: "User groups detected and we are fully connected. Starting auto grouping."});
        groupQueueInterval = setInterval(function () {
            chatAPIChecker(groupList);
        }, 100);
    } else if (!connectionChecker()) {
        logger.info('Not connected to both chat and interactive. Stalling auto grouping.');
        renderWindow.webContents.send('eventlog', {type: "general", username: "System:", event: "Please connect to both chat and interactive to automatically group participants for interactive."});
    } else {
        logger.info('No user groups detected. Skipping auto grouper.');
        renderWindow.webContents.send('eventlog', {type: "general", username: "System:", event: "No user groups detected. Skipping auto grouping."});
    }
}

// Exports
exports.startQueue = groupQueueStart;
exports.stopQueue = groupQueueStop;
exports.groupQueue = groupQueue;
exports.removeUser = removeUserQueue;
exports.clearGroupQueue = clearGroupQueue;
