const dataAccess = require('../common/data-access.js');
const mixerChat = require('../common/mixer-chat');
const commandRouter = require('./command-router.js');


// This holds a list of timed commands progress.
var commandsSaved = [];

// This holds the command timer interval so we can stop or start it as needed.
var cmdTimer = [];

// Cached Firebot
var firebot = [];


// This function kicks off the timed group process.
function timedCommandsProcessor(start){
    // Check to see if we have permission to fire commands.
    if(start){
        console.log('Starting Timed Command Loop')

        // This gets the current interactive info and caches it for chat to pass to the effects handler later.
        var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
        var gameName = dbSettings.getData('/interactive/lastBoard');
        var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);
        firebot = dbControls.getData('/firebot');

        // We have permission to start up the loop now. Let's do this...
        cmdTimer = setInterval(function(){
            var dbCommands = dataAccess.getJsonDbInUserData("/user-settings/chat/commands");
            var timedGroups = dbCommands.getData('/timedGroups');
    
            // Loop through groups and see if it's time to fire anything.
            for (group in timedGroups){
                var group = timedGroups[group];

                // Check to see if this group is active.
                if(group.active){
                    // Check to see if we need to fire a command or if it's still on cooldown.
                    if( timerChecker(group) ){
                        // Time to fire a command.
                        commandCannon(group);                                                
                    }
                }

            } // End group loop

        }, 60000); 

    } else {
        console.log('Stopping Timed Command Loop')
        clearInterval(cmdTimer);
    }
}


// Timer Checker
// This function checks to see if it is time to fire a command in a command group.
// Returns true if it's time to fire.
function timerChecker(group){
    var groupName = group.groupName;
    var groupTimer = group.timer * 60000; // convert to minutes

    // Get current time in milliseconds
    var dateNow = Date.now();

    // Add timer amount to current time. Save to var newTime.
    var newTime = dateNow + groupTimer;

    // Go look into commandsSaved for this group. Save to var oldTime.
    try{
        var cmdSaved = commandsSaved[groupName];
        var oldTime = cmdSaved.timer;
    }catch(err){}

    // If oldTime is undefined, this means this is the first time touching this group. Save it out.
    if(oldTime === undefined){
        commandsSaved[groupName] = group;
        commandsSaved[groupName].firedCommands = []; // Adds this in so we can save what commands have been fired.
    }

    // If new time is bigger than oldTime resolve true, else false.
    if(oldTime === undefined || dateNow > oldTime){
        // Push new value and resolve.
        // set group timer value to expire time for future comparions.
        commandsSaved[groupName].timer = newTime;
        return true;
    } else {
        // Keep old time.
        return false;
    }
}

// Command Cannon
// This function will fire off a command and manage lists of which commands to fire next.
function commandCannon(group){
    var groupName = group.groupName;
    var savedCommand = commandsSaved[groupName];

    // Check saved command list. If there is a command left, fire that command and then move it to a fired commands list.
    // If randomize is on, pick a command randomly from the list.
    if (savedCommand.commands.length > 0){
        // We have commands to fire.
        if(group.randomize === true){
            // Randomize a choice and fire.
            var randomNumber = Math.floor(Math.random()*savedCommand.commands.length);
            var cmdToFire = savedCommand.commands[randomNumber];

            // Move fired command to firedCommands array.
            commandsSaved[groupName].firedCommands.push(cmdToFire);

            // Remove command from non-fired array.
            var i = commandsSaved[groupName].commands.indexOf(cmdToFire);
            if(i != -1) {
                commandsSaved[groupName].commands.splice(i, 1);
            }
            
        } else {
            // Fire the next in line. Non-randomized.
            var cmdToFire = savedCommand.commands[0];

            // Move fired command to firedCommands array.
            commandsSaved[groupName].firedCommands.push(cmdToFire);
            
            // Remove command from non-fired array.
            var i = commandsSaved[groupName].commands.indexOf(cmdToFire);
            if(i != -1) {
                commandsSaved[groupName].commands.splice(i, 1);
            }
        }

        // Get commands
        var dbCommands = dataAccess.getJsonDbInUserData("/user-settings/chat/commands");
        var activeCommands = dbCommands.getData('/Active');
        var command = activeCommands[cmdToFire];

        // Fire the command.
        // TODO: the command sender name is "Timed" and probably should be changed to streamer name.
        // NOTE: There is no chatEvent associated with timed commands because we're not responding to a chat event.
        // NOTE CONT: This might cause issues with some effects that rely on it.
        if(command.active){
            commandRouter.processChatEffects('Timed', false, command, firebot, false, cmdToFire, true);
        } else {
            // The selected command is set to inactive. Pretend like it was fired, and then re-run the command cannon to get a new one.
            console.log('There was an inactive command in a command group. '+command.commandID);

            // Move inactive command to firedCommands array.
            commandsSaved[groupName].firedCommands.push(cmdToFire);

            // Remove inactive from non-fired array.
            var i = commandsSaved[groupName].commands.indexOf(cmdToFire);
            if(i != -1) {
                commandsSaved[groupName].commands.splice(i, 1);
            }
            commandCannon(group);
        }
        
    } else {
        // No commands left to fire. Recycle fired commands, and re-run function.
        commandsSaved[groupName].commands = commandsSaved[groupName].firedCommands;
        commandsSaved[groupName].firedCommands = [];
        commandCannon(group);
    }    
}



// Export Functions
exports.timedCmdLoop = timedCommandsProcessor;