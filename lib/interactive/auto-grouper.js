const Chat = require('./mixer-chat');
const Interactive = require('./mixer-interactive');
const JsonDB = require('node-json-db');

var chatApiPool = 1000; // This is the default rate limit set by mixer and will be updated as we go.
var chatApiReset = 0; // This is the time the rate limit will refresh. Will be updated as we go.
var groupWaitList = [];

// User Queue
// This takes usernames when they connect to interactive and puts them in a queue to be processed when we have api calls available.
function groupQueue(participant){
    var username = participant.username;
    var userID = participant.userID;

    groupWaitList.push({username:username, userid: userID, participant: participant});
}

// Remove User
// This will remove a user from the wait list.
function removeUserQueue(username){
    for(user of groupWaitList){
        var user = user.username;
        if(user == "username"){
            groupWaitList.indexOf(user);
            if (index > -1) {
                groupWaitList.splice(index, 1);
            }
        }
    }
}

// Clear User queue
// This will be used by the disconnect function to clear the wait list.
function clearGroupQueue(){
    var groupWaitList = [];
}

// Chat API Checker
// This checks every X seconds to see if we have any API calls left, and if so it will send a username on to be grouped.
function chatAPIChecker(){
    // See if anyone is in queue.
    if(groupWaitList.length > 0){
        var d = new Date();
        var currentTime = d.getTime();

        // See if we have any API calls left.
        if (chatApiPool > 5 || currentTime > chatApiReset){
            // We Do! So send a user on to get grouped and then remove them from the line.
            var user = groupWaitList[0];
            autoGroup(user.username, user.userid, user.participant);
        } else {
            // We have no API calls left.
            console.log('We have hit our ratelimit! Skipping this call.');
        }
    } else {
        // No users left in the queue.
        return;
    }
}


// Auto Group
// This function automatically groups new users as they connect.
// User must be connected to chat to be grouped.
function autoGroup(username, userid, participant){

    // Set everything to "not used".
    var isUserGrouped = false;
    var proGroup = false;
    var subGroup = false;
    var modGroup = false;
    var staffGroup = false;
    var customGroups = ['banned']; // We set banned here because it's always true.

    // Get list of active groups by checking scenes for the current board.
    try{
        // Get last board name.
        var dbSettings = new JsonDB("./user-settings/settings", true, true);
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);
        var gameScenes = dbControls.getData('./firebot/scenes');

        // Loop through scenes to see which groups are in use.
        for (scene in gameScenes){
            var scene = gameScenes[scene];
            var sceneName = scene.sceneName;
            var groupList = scene.default;

            // Loop through group list and push results to groups..
            // After this we will know which groups are in use currently and which are not.
            for (item of groupList){
                switch(item) {
                    case "Pro":
                        var proGroup = true;
                        break;
                    case "Subscribers":
                        var subGroup = true;
                        break;
                    case "Moderators":
                        var modGroup = true;
                        break;
                    case "Staff":
                        var staffGroup = true;
                        break;
                    default:
                        customGroups.push(item);
                }
            }
        }

        // See if username matches a custom group, if it does put them in there and then end. Else keep going.
        for(item of customGroups){
            try{
                if(item !== "None"){
                    var dbGroups = new JsonDB("./user-settings/groups", true, true);
                    var groupJson = dbGroups.getData('./'+item+'/users');
                    for (user of groupJson){
                        if(username == user){
                            // Move this person to to whatever group we are in now.
                            Interactive.changeGroups(participant, item);
                            
                            // Log Event
                            renderWindow.webContents.send('eventlog', {username: username, event: "was placed into the "+item+" group."});
                            
                            // Set is grouped to true so we can skip an API call.
                            var isUserGrouped = true;
                            break;
                        }
                    }
                }
            }catch(err){console.log(err)}
        }

        // Get user from chat (user roles are not sent via interactive). This is done via a function in mixer-chat.js
        if(isUserGrouped === false){
            Chat.getUser(userid, function(response){
                // Got a response!

                // Get info on ratelimits.
                var info = response.caseless.dict;
                chatApiPool = info['x-ratelimit-remaining'];
                chatApiReset = info['x-ratelimit-reset'];

                // Get user roles
                var response = response.body;
                var mainGroup = response.userRoles[0];

                // See if we can match up any roles to the groups that are in use.
                if (mainGroup == "Staff" && staffGroup === true){
                    // User is a staff member and staff group is active.
                    Interactive.changeGroups(participant, "Staff");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {username: username, event: "was placed into the Staff group."});
                } else if (mainGroup == "Moderator" && modGroup === true || mainGroup == "Owner" && modGroup === true){
                    // User is a moderator and mod group is active.
                    Interactive.changeGroups(participant, "Moderators");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {username: username, event: "was placed into the Moderator group."});
                } else if (mainGroup == "Subscriber" && subGroup === true){
                    // User is a subscriber and sub group is active.
                    Interactive.changeGroups(participant, "Subscribers");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {username: username, event: "was placed into the Subscriber group."});
                } else if (mainGroup == "Pro" && proGroup === true){
                    // User is a pro and pro group is active.
                    Interactive.changeGroups(participant, "Pro");
                    // Log Event
                    renderWindow.webContents.send('eventlog', {username: username, event: "was placed into the Pro group."});
                } else {
                    renderWindow.webContents.send('eventlog', {username: username, event: "will remain in the default group."});
                }
                var isUserGrouped = true; // Set this to true here no matter what. Now they HAVE to be grouped somehow.
            });
        }
 
        // Cut person out of queue.
        groupWaitList.splice(0, 1);

    }catch(err){console.log(err)};
}

// Queue Checker
// This starts checking to see if anyone is in the user queue.
function groupQueueStart(){
    console.log('Starting autogrouping queue.')
    groupQueueInterval = setInterval(function (){
        chatAPIChecker();
    }, 100);
}

// Queue Stopper
// This stops the groupQueueChecker
function groupQueueStop(){
    if(groupQueueInterval !== undefined){
        console.log('Stopping autogroup queue.');
        clearInterval(groupQueueInterval);
        clearGroupQueue();
    }
}


// Exports
exports.startQueue = groupQueueStart;
exports.stopQueue = groupQueueStop;
exports.groupQueue = groupQueue;
exports.removeUser = removeUserQueue;
exports.clearGroupQueue = clearGroupQueue;