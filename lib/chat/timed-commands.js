'use strict';

const dataAccess = require('../common/data-access.js');
const mixerInteractive = require('../common/mixer-interactive.js');
const mixerChat = require('../common/mixer-chat');
const commandRouter = require('./command-router.js');
const logger = require('../logwrapper');


// This holds a list of timed commands progress.
let commandsSaved = [];

// This holds the command timer interval so we can stop or start it as needed.
let cmdTimer = [];

// Cached Controls
let interactiveCache = [];

// Timer Checker
// This function checks to see if it is time to fire a command in a command group.
// Returns true if it's time to fire.
function timerChecker(group) {
    let groupName = group.groupName;
    let groupTimer = group.timer * 60000; // convert to minutes

    // Get current time in milliseconds
    let dateNow = Date.now();

    // Add timer amount to current time. Save to var newTime.
    let newTime = dateNow + groupTimer;
    let oldTime;

    // Go look into commandsSaved for this group. Save to var oldTime.
    try {
        let cmdSaved = commandsSaved[groupName];
        oldTime = cmdSaved.timerCheck;
    } catch (ignore) { } //eslint-disable-line no-empty

    // If oldTime is undefined, this means this is the first time touching this group. Save it out.
    if (oldTime === undefined) {
        commandsSaved[groupName] = group;
        commandsSaved[groupName].firedCommands = []; // Adds this in so we can save what commands have been fired.
    }

    // If new time is bigger than oldTime resolve true, else false.
    if (oldTime === undefined || dateNow > oldTime) {
        // Push new value and resolve.
        // set group timer value to expire time for future comparions.
        commandsSaved[groupName].timerCheck = newTime;
        return true;
    }
    // Keep old time.
    return false;

}

// Command Cannon
// This function will fire off a command and manage lists of which commands to fire next.
function commandCannon(group) {
    let groupName = group.groupName;
    let savedCommand = commandsSaved[groupName];
    let cmdToFire;

    // Check saved command list. If there is a command left, fire that command and then move it to a fired commands list.
    // If randomize is on, pick a command randomly from the list.
    if (savedCommand.commands.length > 0) {
        // We have commands to fire.
        if (group.randomize === true) {
            // Randomize a choice and fire.
            let randomNumber = Math.floor(Math.random() * savedCommand.commands.length);
            cmdToFire = savedCommand.commands[randomNumber];

            // Move fired command to firedCommands array.
            commandsSaved[groupName].firedCommands.push(cmdToFire);

            // Remove command from non-fired array.
            let i = commandsSaved[groupName].commands.indexOf(cmdToFire);
            if (i !== -1) {
                commandsSaved[groupName].commands.splice(i, 1);
            }

        } else {
            // Fire the next in line. Non-randomized.
            cmdToFire = savedCommand.commands[0];

            // Move fired command to firedCommands array.
            commandsSaved[groupName].firedCommands.push(cmdToFire);

            // Remove command from non-fired array.
            let i = commandsSaved[groupName].commands.indexOf(cmdToFire);
            if (i !== -1) {
                commandsSaved[groupName].commands.splice(i, 1);
            }
        }

        // Get commands
        let commandCache = mixerChat.getCommandCache();
        let activeCommands = commandCache['Active'];
        let command = activeCommands[cmdToFire];

        let unfiredArray = commandsSaved[groupName].commands;
        let firedArray = commandsSaved[groupName].firedCommands;
        let testArray = unfiredArray.concat(firedArray);


        // Fire the command.
        // TODO: the command sender name is "Timed" and probably should be changed to streamer name.
        // NOTE: There is no chatEvent associated with timed commands because we're not responding to a chat event.
        // NOTE CONT: This might cause issues with some effects that rely on it.
        if (command != null && testArray.indexOf(cmdToFire) !== -1) {
            // This command is still active. Fire it!
            commandRouter.processChatEffects('Timed', false, command, interactiveCache, false, { cmd: cmdToFire, args: [] }, true);
        } else {
            // This command is inactive! Let's clean up this list.
            // This should never happen unless the command cache gets out of sync. If it does this will fix it.
            logger.info('Timed Command list had an inactive command (' + cmdToFire + ') in it. Cleaning up the list a trying again.');
            let dbCommands = dataAccess.getJsonDbInUserData('/user-settings/chat/commands');
            let commandList = dbCommands.getData('/timedGroups/' + groupName + '/commands');
            let commandListClean = commandList.filter(function(el) {
                return (el !== cmdToFire);
            });
            dbCommands.push('/timedGroups/' + groupName + '/commands', commandListClean);

            // Remove command from non-fired array so we don't accidently hit it again in this next try.
            let i = commandsSaved[groupName].commands.indexOf(cmdToFire);
            if (i !== -1) {
                commandsSaved[groupName].commands.splice(i, 1);
            }

            // Remove command from fired array so we don't accidently hit it again in this next try.
            let f = commandsSaved[groupName].firedCommands.indexOf(cmdToFire);
            if (f !== -1) {
                commandsSaved[groupName].firedCommands.splice(f, 1);
            }

            // Refresh command cache
            mixerChat.refreshCommandCache();

            // Fire the command cannon again.
            commandCannon(group);
        }

    } else {
        // No commands left to fire. Recycle fired commands, and re-run function.
        commandsSaved[groupName].commands = commandsSaved[groupName].firedCommands;
        commandsSaved[groupName].firedCommands = [];
        commandCannon(group);
    }
}

// This function kicks off the timed group process.
function timedCommandsProcessor(start) {
    // Check to see if we have permission to fire commands.
    if (start) {
        logger.info('Starting Timed Command Loop');

        // This gets the current interactive info and caches it for chat to pass to the effects handler later.
        let interactive = mixerInteractive.getInteractiveCache();
        interactiveCache = interactive['firebot'];

        // We have permission to start up the loop now. Let's do this...
        cmdTimer = setInterval(function() {
            let commandCache = mixerChat.getCommandCache();
            let timedGroups = commandCache['timedGroups'];
            let group;

            // Loop through groups and see if it's time to fire anything.
            for (group in timedGroups) {
                if (timedGroups.hasOwnProperty(group)) {
                    group = timedGroups[group];

                    // Check to see if this group is active.
                    if (group.active) {
                        // Check to see if we need to fire a command or if it's still on cooldown.
                        if (timerChecker(group)) {
                            // Time to fire a command.
                            commandCannon(group);
                        }
                    }
                }
            } // End group loop

        }, 60000);

    } else {
        logger.info('Stopping Timed Command Loop');
        clearInterval(cmdTimer);
    }
}

// Export Functions
exports.timedCmdLoop = timedCommandsProcessor;
