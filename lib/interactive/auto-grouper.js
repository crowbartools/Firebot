const Chat = require('./beam-chat');
const Interactive = require('./beam-interactive');
const JsonDB = require('node-json-db');

var chatApiPool = 500; // 500 is how many calls beam gives us every 60 seconds.
var groupWaitList = [];

// User Queue
// This takes usernames when they connect to interactive and puts them in a queue to be processed when we have api calls available.
function groupQueue(participant){
    var username = participant.username;
    var userID = participant.userID;

    groupWaitList.push({username:username, userid: userID, participant: participant});
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
        // See if we have any API calls left.
        if (chatApiPool > 1){
            // We Do! So send a user on to get grouped and then remove them from the line.
            var user = groupWaitList[0];
            autoGroup(user.username, user.userid, user.participant);
        } else {
            // We have no API calls left.
            console.log('No API calls are left. Skipping user grouping run.');
            
            //TODO: What do we do here? We're out of API calls.
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
    var customGroups = [];

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
                var dbGroups = new JsonDB("./user-settings/groups", true, true);
                var groupJson = dbGroups.getData('./'+item+'/users');
                for (user of groupJson){
                    if(username == user){
                        // Move this person to to whatever group we are in now.
                        Interactive.changeGroups(participant, item);
                        console.log(username+' was placed into the '+item+' group.');
                        var isUserGrouped = true;
                        break;
                    }
                }
            }catch(err){console.log(err)}
        }

        // Get user from chat (user roles are not sent via interactive). This is done via a function in beam-chat.js
        if(isUserGrouped === false){
            Chat.getUser(userid, function(response){
                // Got a response!
                var mainGroup = response.userRoles[0];

                // See if we can match up any roles to the groups that are in use.
                if (mainGroup == "Staff" && staffGroup === true){
                    // User is a staff member and staff group is active.
                    Interactive.changeGroups(participant, "Staff");
                    console.log(username+' was placed into the Staff group.');
                } else if (mainGroup == "Moderator" && modGroup === true || mainGroup == "Owner" && modGroup === true){
                    // User is a moderator and mod group is active.
                    Interactive.changeGroups(participant, "Moderators");
                    console.log(username+' was placed into the Moderator group.');
                } else if (mainGroup == "Subscriber" && subGroup === true){
                    // User is a subscriber and sub group is active.
                    Interactive.changeGroups(participant, "Subscribers");
                    console.log(username+' was placed into the Subscriber group.');
                } else if (mainGroup == "Pro" && proGroup === true){
                    // User is a pro and pro group is active.
                    Interactive.changeGroups(participant, "Pro");
                    console.log(username+' was placed into the Pro group.');
                } else {
                    console.log(username+' will remain in the default group.');
                }
                var isUserGrouped = true; // Set this to true here no matter what. Now they HAVE to be grouped somehow.
            });
        }
 
        // Cut person out of queue.
        groupWaitList.splice(0, 1);

    }catch(err){console.log(err)};
}







// This checks to see if anyone is in the queue to get grouped.
setInterval(function (){
    chatAPIChecker();
}, 1000);

// Exports
exports.groupQueue = groupQueue;
exports.clearGroupQueue = clearGroupQueue;