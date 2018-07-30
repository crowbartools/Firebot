'use strict';

const dataAccess = require('../common/data-access.js');
const mixerChat = require('../common/mixer-chat');
const groupsAccess = require('../common/groups-access');
const effectRunner = require('../common/effect-runner.js');
const { TriggerType } = require('../common/EffectType');
const logger = require('../logwrapper');

// This array holds ids of messages that have recently been handled by a logged in account.
let handledMessageIds = [];

// This holds a list of command id's and the time they are off cooldown.
let cooldownSaved = [];

// This holds the name of the streamer
let streamerName = false;
let botName = false;

// Parses command and returns command and arguments.
function getParsedCommand(rawMessage) {
    let commandRegex = new RegExp("^(\\S+)\\b\\s?(.*)?", "i");
    let matches = rawMessage.match(commandRegex);

    if (matches == null) return null;

    let command = matches[1];
    let rawArgs = matches[2] ? matches[2] : "";
    let args = rawArgs.split(" ");

    if (args.length === 1 && args[0] === "") {
        args = [];
    }

    return {
        cmd: {
            value: command,
            is: function(array) {
                return array.includes(this.value);
            }
        },
        args: args
    };
}

// This function builds out a effects package to be sent on after all checks have passed.
function processChatEffects(commandSender, isWhisper, command, interactiveCache, chatEvent, userCommand, timedCmd) {

    let processEffectsRequest = {
        trigger: {
            type: TriggerType.COMMAND,
            metadata: {
                username: commandSender,
                command: command,
                userCommand: userCommand,
                chatEvent: chatEvent,
                isTimed: timedCmd
            }
        },
        effects: command.effects
    };

    // Log the action in Firebot's log.
    if (command.skipLog !== true) {
        renderWindow.webContents.send('eventlog', {type: "general", username: commandSender, event: "used the " + command.commandID + " command."});
    }

    // Throw chat alert if we have it active.
    if (command.chatFeedAlert === true) {
        renderWindow.webContents.send('chatUpdate', {fbEvent: "ChatAlert", message: commandSender + " used the " + command.commandID + " command."});
    }

    // Send off the package to the real hero of firebot.
    return effectRunner.processEffects(processEffectsRequest);
}

// This maps the apps role names to actual mixer chat role names.
function mapRoleNames(permissions) {
    if (permissions == null || permissions.length === 0) return [];
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

// This takes a username and chat event, and returns an array of all standard roles and viewer groups they're in.
function getCombinedRoles(username, chatEvent) {
    logger.debug("getting combined roles");
    let chatterRoles = chatEvent.user_roles;
    logger.debug("getting custom view groups for user");
    let chatterCustomRoles = groupsAccess.getGroupsForUser(username);
    logger.debug("combining mixer and custom groups");
    for (let role in chatterCustomRoles) {
        if (chatterCustomRoles.hasOwnProperty(role)) {
            chatterRoles.push(chatterCustomRoles[role].groupName);
        }
    }
    logger.debug("returning roles");
    return chatterRoles;
}

// This checks to see if the user is in a specific role.
function userIsInRole(userRoles, approvedRoles) {
    logger.debug("checking if user is in roles:", approvedRoles);
    if (approvedRoles == null || approvedRoles.length === 0) {
        return true;
    }

    logger.debug("checking each group");

    let foundMatch = false;
    userRoles.forEach((uRole) => {
        if (approvedRoles.includes(uRole)) {
            foundMatch = true;
        }
    });
    return foundMatch;
}

// Cooldown Checker
// This function checks to see if a command is on cooldown or not.
function cooldownChecker(commandID, cooldown) {

    if (cooldown != null && cooldown !== "" && cooldown !== "0") {
        cooldown = parseInt(cooldown) * 1000;

        // Get current time in milliseconds
        let dateNow = Date.now();

        // Add cooldown amount to current time. Save to var newTime.
        let newTime = dateNow + cooldown;

        // Go look into cooldownSaved for this button. Save to var oldTime.
        let oldTime = cooldownSaved[commandID];

        // If new time is bigger than oldTime resolve true, else false.
        if (oldTime === undefined || dateNow > oldTime) {
        // Push new value and resolve.
            cooldownSaved[commandID] = newTime;
            return true;
        }
        // Keep old time. We're still on cooldown.
        return false;

    }
    // No cooldown entered, return true and let's fire the command.
    return true;
}

// This function is basically like a security checkpoint. It checks the chat message against several rules and sends it on.
function handleChatCommand(chatEvent, chatter, interactiveCache) {

    let rawMessage = "";
    chatEvent.message.message.forEach(m => {
        rawMessage += m.text;
    });

    let isWhisper = chatEvent.message.meta.whisper === true;
    let commandSender = chatEvent.user_name; // Username of the person that sent the command.

    // Parses command and sees if it is null or not.
    let userCommand = getParsedCommand(rawMessage);
    if (userCommand == null) return;

    // If the chat came from a bot, ignore it.
    if ((chatEvent.user_name === botName || chatter === 'bot') && !isWhisper) {
        return;
    }

    // Check to see if handled message array contains the id of this message already.
    // If it does, that means that one of the logged in accounts has already handled the message.
    if (handledMessageIds.includes(chatEvent.id)) {
    // We can remove the handled id now, to keep the array small.
        handledMessageIds = handledMessageIds.filter(id => id !== chatEvent.id);
        return;
    }
    // throw the message id into the array. This prevents both the bot and the streamer accounts from replying
    handledMessageIds.push(chatEvent.id);


    // Get commands
    let dbCommands = mixerChat.getCommandCache();
    let activeCommands = dbCommands['Active'];

    logger.debug("Looping thru commands");
    // Loop through commands and look for matching trigger.
    for (let command in activeCommands) {
        if (activeCommands.hasOwnProperty(command)) {

            command = activeCommands[command];
            let trigger = command['trigger'];

            // Check to see if the command matches a trigger from our commands file.
            if (userCommand['cmd'].value === trigger) {

                logger.debug("found cmd match: " + trigger);

                if (command.permissionType === "Group") {
                    // This is a group permission check.
                    logger.debug("checking roles");
                    let userHasPermission = userIsInRole(getCombinedRoles(commandSender, chatEvent), mapRoleNames(command.permissions));

                    logger.debug("user has permission to run command: " + userHasPermission);
                    if (!userHasPermission && commandSender !== streamerName) {
                        logger.info(commandSender + ' said a thing without permission!');
                        // User doesn't have permission.
                        mixerChat.whisper('bot', commandSender, "You do not have permission to use this command!");
                        return;
                    }

                    logger.debug("user has permission to run cmd");

                    // User has permission or is the streamer.
                    if (cooldownChecker(command.commandID, command.cooldown) === true || commandSender === streamerName) {
                        logger.debug("no cooldown or cooldown passed1");
                        processChatEffects(commandSender, isWhisper, command, interactiveCache, chatEvent, userCommand, false);
                        return;
                    }

                    mixerChat.whisper('bot', commandSender, "This command is on cooldown!");
                    return;
                } else if (command.permissionType === "Individual") {
                    // This is an "individual" permission check.
                    if (commandSender === command.permissions || command.permissions === "") {
                        // User has permission.
                        if (cooldownChecker(command.commandID, command.cooldown) === true || commandSender === streamerName) {
                            processChatEffects(commandSender, isWhisper, command, interactiveCache, chatEvent, userCommand, false);
                        } else {
                            mixerChat.whisper('bot', commandSender, "This command is on cooldown!");
                        }
                        return;
                    }

                    // User doesn't have permission.
                    logger.info(commandSender + ' said a thing without permission!');
                    mixerChat.whisper('bot', commandSender, "You do not have permission to use this command!");
                    return;
                }


                // No permissions to check against at all.
                if (cooldownChecker(command.commandID, command.cooldown) === true || commandSender === streamerName) {
                    logger.debug("user has permission to run cmd1");
                    processChatEffects(commandSender, isWhisper, command, interactiveCache, chatEvent, userCommand, false);
                } else {
                    mixerChat.whisper('bot', commandSender, "This command is on cooldown!");
                }
                return;
            }
        }
    }
}

// Update streamer and bot username cache
function updateStreamerUsername() {
    let authDb = dataAccess.getJsonDbInUserData('/user-settings/auth');

    try {
        streamerName = authDb.getData('/streamer/username');
    } catch (err) {
        logger.warn('Couldnt update streamer username cache.');
    }

    try {
        botName = authDb.getData('/bot/username');
    } catch (err) {
        botName = false;
    }
}


// Export Functions
exports.handleChatCommand = handleChatCommand;
exports.processChatEffects = processChatEffects;
exports.updateStreamerUsername = updateStreamerUsername;
