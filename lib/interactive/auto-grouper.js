'use strict';

const Chat = require('../common/mixer-chat');
const Interactive = require('../common/mixer-interactive');
const dataAccess = require('../common/data-access.js');

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
                groupWaitList.splice(index, 1);
            }
        }
    }
}

// Clear User queue
// This will be used by the disconnect function to clear the wait list.
function clearGroupQueue(groupWaitList) {
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
    var isUserGrouped = false;

    try {
        // See if username matches a custom group, if it does put them in there and then end. Else keep going.
        for (item of groupList.customGroups) {
            try {
                let dbGroups = dataAccess.getJsonDbInUserData("/user-settings/groups");
                let groupJson = dbGroups.getData('./' + item + '/users');

                for (user of groupJson) {
                    if (username.toLowerCase() == user.toLowerCase()) {
                        // Move this person to to whatever group we are in now.
                        Interactive.changeGroups(participant, item);

                        // Log Event
                        renderWindow.webContents.send('eventlog', {username: username, event: "was placed into the " + item + " group."});

                        // Set is grouped to true so we can skip an API call.
                        var isUserGrouped = true;
                        break;
                    }
                }
            } catch (err) {
                console.log(err);
            }
        }

        // Get user from chat (user roles are not sent via interactive). This is done via a function in mixer-chat.js
        if (isUserGrouped === false) {
            Chat.getUser(userid, function(response) {
                // Got a response!
                //console.log(response);

                // Get info on ratelimits.
                let info = response.caseless.dict;
                chatApiPool = info['x-ratelimit-remaining'];
                chatApiReset = info['x-ratelimit-reset'];
                //console.log('Rate Limit: '+chatApiPool+' || '+chatApiReset);

                // Get user roles
                var response = response.body;
                let mainGroup = response.userRoles[0];

                // See if we can match up any roles to the groups that are in use.
                if (mainGroup == "Staff" && groupList.staffGroup === true) {
                    // User is a staff member and staff group is active.
                    Interactive.changeGroups(participant, "Staff");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {username: username, event: "was placed into the Staff group."});
                } else if (mainGroup == "Mod" && groupList.modGroup === true || mainGroup == "Owner" && groupList.modGroup === true) {
                    // User is a moderator and mod group is active.
                    Interactive.changeGroups(participant, "Moderators");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {username: username, event: "was placed into the Moderator group."});
                } else if (mainGroup == "Subscriber" && groupList.subGroup === true) {
                    // User is a subscriber and sub group is active.
                    Interactive.changeGroups(participant, "Subscribers");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {username: username, event: "was placed into the Subscriber group."});
                } else if (mainGroup == "Pro" && groupList.proGroup === true) {
                    // User is a pro and pro group is active.
                    Interactive.changeGroups(participant, "Pro");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {username: username, event: "was placed into the Pro group."});
                } else {
                    renderWindow.webContents.send('eventlog', {username: username, event: "will remain in the default group."});
                }
                let isUserGrouped = true; // Set this to true here no matter what. Now they HAVE to be grouped somehow.
            });
        }

        // Cut person out of queue.
        groupWaitList.splice(0, 1);

    } catch (err) {
        console.log(err);
    }
}


// Queue Checker
// This starts checking to see if anyone is in the user queue.
function groupQueueStart() {
    let groupList = groupChecker();
    if (groupList !== false && connectionChecker()) {
        console.log('User groups detected. Starting Auto Grouper.');
        renderWindow.webContents.send('eventlog', {username: "System:", event: "User groups detected and we are fully connected. Starting auto grouping."});
        groupQueueInterval = setInterval(function () {
            chatAPIChecker(groupList);
        }, 100);
    } else if (!connectionChecker()) {
        console.log('Not connected to both chat and interactive. Stalling auto grouping.');
        renderWindow.webContents.send('eventlog', {username: "System:", event: "Please connect to both chat and interactive to automatically group participants for interactive."});
    } else {
        console.log('No user groups detected. Skipping auto grouper.');
        renderWindow.webContents.send('eventlog', {username: "System:", event: "No user groups detected. Skipping auto grouping."});
    }
}

// Queue Stopper
// This stops the groupQueueChecker
function groupQueueStop() {
    if (groupQueueInterval !== null && groupQueueInterval !== undefined) {
        console.log('Stopping autogroup queue.');
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
            renderWindow.webContents.send('eventlog', {username: "System:", event: "Interactive auto grouping stopped. Please connect to both chat and interactive to restart."});
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
        let gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        let dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/" + gameName);
        let gameScenes = dbControls.getData('./firebot/scenes');


        // Loop through scenes to see which groups are in use.
        for (scene in gameScenes) {
            scene = gameScenes[scene];
            let sceneName = scene.sceneName;
            let groupList = scene.default;

            // Loop through group list and push results to groups..
            // After this we will know which groups are in use currently and which are not.
            for (item of groupList) {
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
                case "Staff":
                    groupObject.staffGroup = true;
                    break;
                default:
                    if (item !== "None") {
                        groupObject.customGroups.push(item);
                    }
                }
            }
        }

        // If any of the auto group items are true then return the group object.
        for (var i in groupObject) {
            if (groupObject[i] === true) {
                return groupObject;
            }
        }

        // If custom groups has any item other than banned return the group object.
        for (var i of groupObject.customGroups) {
            if (i !== "banned") {
                return groupObject;
            }
        }

        // Otherwise, user is not using any auto group roles or custom groups.
        return false;

    } catch (err) {
        console.log(err);
        console.log('Group checker error.');
    }
}


// Exports
exports.startQueue = groupQueueStart;
exports.stopQueue = groupQueueStop;
exports.groupQueue = groupQueue;
exports.removeUser = removeUserQueue;
exports.clearGroupQueue = clearGroupQueue;
