"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const accountAccess = require("../../common/account-access");
const util = require("../../utility");
const moment = require("moment");
const NodeCache = require("node-cache");
const restrictionsManager = require("../../restrictions/restriction-manager");
const { TriggerType } = require("../../common/EffectType");

// commandaccess
const commandManager = require("./CommandManager");

// custom command exectutor
const customCommandExecutor = require("./customCommandExectutor");

const cooldownCache = new NodeCache({ stdTTL: 1, checkperiod: 1 });

let handledMessageIds = [];

/**
 * A command issued by a user(viewer)
 *
 * @param {string} trigger the word that triggered the command
 * @param {string[]} args List of args the user provided with the command
 * @param {string} commandSender username of the person who issued the command
 */
function UserCommand(trigger, args, commandSender, senderRoles) {
    this.trigger = trigger;
    this.args = args;
    this.triggeredArg = null;
    this.subcommandId = null;
    this.commandSender = commandSender;
    if (!senderRoles) {
        senderRoles = [];
    }
    this.senderRoles = senderRoles;
}

function buildCommandRegexStr(trigger, scanWholeMessage) {
    let escapedTrigger = util.escapeRegExp(trigger);
    if (scanWholeMessage) {
        return `(?:^|\\s)${escapedTrigger}(?:\\b|$|(?=\\s))`;
    }
    return `^${escapedTrigger}(?:\\b|$|(?=\\s))`;
}

function checkForCommand(rawMessage) {
    if (rawMessage == null || rawMessage.length < 1) return null;
    let normalziedRawMessage = rawMessage.toLowerCase();

    let allCommands = commandManager.getAllActiveCommands();

    for (let command of allCommands) {
        let normalizedTrigger = command.trigger.toLowerCase(),
            commandRegexStr = command.triggerIsRegex
                ? command.trigger
                : buildCommandRegexStr(normalizedTrigger, command.scanWholeMessage);

        let regex = new RegExp(commandRegexStr, "gi");

        if (regex.test(normalziedRawMessage)) {
            return command;
        }
    }
    return null;
}

function updateCommandCount(command) {
    if (command.count == null) command.count = 0;
    command.count++;
    renderWindow.webContents.send("commandCountUpdate", {
        commandId: command.id,
        count: command.count
    });
}

function flushCooldownCache() {
    cooldownCache.flushAll();
}

function getRemainingCooldown(command, triggeredSubcmd, username) {
    let cooldown;
    if (triggeredSubcmd == null || triggeredSubcmd.cooldown == null) {
        cooldown = command.cooldown;
    } else {
        cooldown = triggeredSubcmd.cooldown;
    }
    if (cooldown == null) return 0;

    let globalCacheKey = `${command.id}${
        triggeredSubcmd ? `:${triggeredSubcmd.arg}` : ""
    }`;

    let userCacheKey = `${command.id}${
        triggeredSubcmd ? `:${triggeredSubcmd.arg}` : ""
    }:${username}`;

    let remainingGlobal = 0,
        remainingUser = 0;

    if (cooldown.global > 0) {
        let globalCooldown = cooldownCache.get(globalCacheKey);
        if (globalCooldown != null) {
            remainingGlobal = globalCooldown.diff(moment(), "s");
        }
    }
    if (cooldown.user > 0) {
        let userCooldown = cooldownCache.get(userCacheKey);
        if (userCooldown != null) {
            remainingUser = userCooldown.diff(moment(), "s");
        }
    }

    if (remainingUser > 0) {
        return remainingUser;
    } else if (remainingGlobal > 0) {
        return remainingGlobal;
    }
    return 0;
}

function cooldownCommand(command, triggeredSubcmd, username) {
    let cooldown;
    if (triggeredSubcmd == null || triggeredSubcmd.cooldown == null) {
        cooldown = command.cooldown;
    } else {
        cooldown = triggeredSubcmd.cooldown;
    }
    if (cooldown == null) return 0;
    logger.debug("Triggering cooldown for command");

    let globalCacheKey = `${command.id}${
        triggeredSubcmd ? `:${triggeredSubcmd.arg}` : ""
    }`;

    let userCacheKey = `${command.id}${
        triggeredSubcmd ? `:${triggeredSubcmd.arg}` : ""
    }:${username}`;

    if (cooldown.global > 0) {
        if (cooldownCache.get(globalCacheKey) == null) {
            cooldownCache.set(
                globalCacheKey,
                moment().add(cooldown.global, "s"),
                cooldown.global
            );
        }
    }
    if (cooldown.user > 0) {
        cooldownCache.set(
            userCacheKey,
            moment().add(cooldown.user, "s"),
            cooldown.user
        );
    }
}

function buildUserCommand(command, rawMessage, sender, senderRoles) {
    let trigger = command.trigger,
        args = [],
        commandSender = sender;

    if (rawMessage != null) {
        if (command.scanWholeMessage) {
            args = rawMessage.split(" ");
        } else {
            let rawArgs = rawMessage.split(" ");
            if (rawArgs.length > 0) {
                trigger = rawArgs[0];
                args = rawArgs.splice(1);
            }
        }
    }

    args = args.filter(a => a.trim() !== "");

    return new UserCommand(trigger, args, commandSender, senderRoles);
}

function fireCommand(
    command,
    userCmd,
    chatEvent,
    commandSender,
    isManual = false
) {
    if (command == null) return;
    if (commandSender == null) {
        commandSender = accountAccess.getAccounts().streamer.username;
    }

    logger.info("Checking command type... " + command.type);

    if (command.type === "system") {
        logger.info("Executing system command");
        //get system command from manager
        let cmdDef = commandManager.getSystemCommandById(command.id);

        let commandOptions = {};
        if (command.options != null) {
            for (let optionName of Object.keys(command.options)) {
                let option = command.options[optionName];
                if (option) {
                    let value = option.value;
                    if (value == null) {
                        value = option.default;
                    }
                    commandOptions[optionName] = value;
                }
            }
        }

        //call trigger event.
        cmdDef.onTriggerEvent({
            command: command,
            commandOptions: commandOptions,
            userCommand: userCmd,
            chatEvent: chatEvent
        });
    } else if (command.type === "custom") {
        logger.info("Executing custom command effects");
        customCommandExecutor.execute(command, userCmd, chatEvent, isManual);
    }
}

async function handleChatEvent(chatEvent) {

    const chat = require("../chat");

    logger.debug("Checking for command in message...");

    let commandSender = chatEvent.user_name; // Username of the person that sent the command.

    // Check to see if handled message array contains the id of this message already.
    // If it does, that means that one of the logged in accounts has already handled the message.
    if (handledMessageIds.includes(chatEvent.id)) {
        // We can remove the handled id now, to keep the array small.
        handledMessageIds = handledMessageIds.filter(id => id !== chatEvent.id);
        return false;
    }
    // throw the message id into the array. This prevents both the bot and the streamer accounts from replying
    handledMessageIds.push(chatEvent.id);

    logger.debug("Combining message segments...");
    let rawMessage = "";
    chatEvent.message.message.forEach(m => {
        rawMessage += m.text;
    });

    // search for and return command if found
    logger.debug("Searching for command...");
    let command = checkForCommand(rawMessage);

    // command wasnt found
    if (command == null) {
        return false;
    }

    // check if chat came from the bot and if we should ignore it.
    if (chatEvent.user_name === accountAccess.getAccounts().bot.username && command.ignoreBot !== false) {
        logger.debug("Message came from bot and this command is set to ignore it");
        return false;
    }

    //check if command originated from a costream channel
    let streamerChannelId = accountAccess.getAccounts().streamer.channelId;
    if (chatEvent.channel !== streamerChannelId && !command.allowInCostreams) {
        logger.debug("Chat originated in another stream and allowInCostreams is not enabled. Ignoring.");
        return false;
    }

    // build usercommand object
    let userCmd = buildUserCommand(command, rawMessage, commandSender, chatEvent.user_roles);

    let triggeredSubcmd = null;
    if (!command.scanWholeMessage && userCmd.args.length > 0 && command.subCommands) {
        for (let subcmd of command.subCommands) {
            if (subcmd.active === false) continue;
            if (subcmd.regex) {
                let regex = new RegExp(`^${subcmd.arg}$`, "gi");
                if (regex.test(userCmd.args[0])) {
                    triggeredSubcmd = subcmd;
                    userCmd.triggeredArg = subcmd.arg;
                    userCmd.subcommandId = subcmd.id;
                }
            } else {
                if (subcmd.arg.toLowerCase() === userCmd.args[0].toLowerCase()) {
                    triggeredSubcmd = subcmd;
                    userCmd.triggeredArg = subcmd.arg;
                    userCmd.subcommandId = subcmd.id;
                }
            }
        }
    }

    if (command.autoDeleteTrigger || (triggeredSubcmd && triggeredSubcmd.autoDeleteTrigger)) {
        logger.debug("Auto delete trigger is on, attempting to delete chat message");
        chat.deleteMessage(chatEvent.id);
    }

    // check if command meets min args requirement
    let minArgs = triggeredSubcmd ? triggeredSubcmd.minArgs || 0 : command.minArgs || 0;
    if (userCmd.args.length < minArgs) {
        let usage = triggeredSubcmd ? triggeredSubcmd.usage : command.usage;
        chat.sendChatMessage(`Invalid command. Usage: ${command.trigger} ${usage || ""}`, commandSender);
        return false;
    }

    let restrictionData =
        triggeredSubcmd && triggeredSubcmd.restrictionData && triggeredSubcmd.restrictionData.restrictions
            && triggeredSubcmd.restrictionData.restrictions.length > 0
            ? triggeredSubcmd.restrictionData
            : command.restrictionData;

    // Handle restrictions
    if (restrictionData) {
        logger.debug("Command has restrictions...checking them.");
        let triggerData = {
            type: TriggerType.COMMAND,
            metadata: {
                username: commandSender,
                userId: chatEvent.user_id,
                userMixerRoles: chatEvent.user_roles,
                command: command,
                userCommand: userCmd,
                chatEvent: chatEvent
            }
        };
        try {
            await restrictionsManager.runRestrictionPredicates(triggerData, restrictionData);
            logger.debug("Restrictions passed!");
        } catch (restrictionReason) {
            let reason;
            if (Array.isArray(restrictionReason)) {
                reason = restrictionReason.join(", ");
            } else {
                reason = restrictionReason;
            }
            logger.debug(`${commandSender} could not use command '${command.trigger}' because: ${reason}`);
            chat.sendChatMessage("You cannot use this command because: " + reason, commandSender);
            return false;
        }
    }

    logger.debug("Checking cooldowns for command...");
    // Check if the command is on cooldown
    let remainingCooldown = getRemainingCooldown(
        command,
        triggeredSubcmd,
        commandSender
    );

    if (remainingCooldown > 0) {
        logger.debug("Command is still on cooldown, alerting viewer...");
        chat.sendChatMessage(
            "This command is still on cooldown for: " +
        util.secondsForHumans(remainingCooldown),
            commandSender
        );
        return false;
    }

    // add cooldown to cache if commmand has cooldowns set
    cooldownCommand(command, triggeredSubcmd, commandSender);

    // Log the action in Firebot's log.
    if (command.skipLog !== true) {
        logger.debug("Sending activity log for command to front end.");
        renderWindow.webContents.send("eventlog", {
            type: "general",
            username: commandSender,
            event: "used the " + command.trigger + " command."
        });
    }

    // Throw chat alert if we have it active.
    /*if (command.chatFeedAlert === true) {
        renderWindow.webContents.send("chatUpdate", {
            fbEvent: "ChatAlert",
            message: commandSender + " used the " + command.trigger + " command."
        });
    }*/

    //update the count for the command
    if (command.type === "custom") {
        logger.debug("Updating command count.");
        updateCommandCount(command);
    }

    fireCommand(command, userCmd, chatEvent, commandSender, false, false);
    return true;
}

function triggerCustomCommand(id, isManual = true) {
    let command = commandManager.getCustomCommandById(id);
    if (command) {
        console.log("firing command manually", command);
        let commandSender = accountAccess.getAccounts().streamer.username,
            userCmd = buildUserCommand(command, null, commandSender);
        fireCommand(command, userCmd, null, commandSender, isManual);
    }
}

// Refresh command cooldown cache when changes happened on the front end
ipcMain.on("commandManualTrigger", function(event, id) {
    triggerCustomCommand(id, true);
});

// Refresh command cooldown cache when changes happened on the front end
ipcMain.on("refreshCommandCache", function() {
    flushCooldownCache();
});

exports.handleChatEvent = handleChatEvent;
exports.triggerCustomCommand = triggerCustomCommand;
exports.flushCooldownCache = flushCooldownCache;
