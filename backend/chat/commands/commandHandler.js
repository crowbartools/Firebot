"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const accountAccess = require("../../common/account-access");
const util = require("../../utility");
const moment = require("moment");
const NodeCache = require("node-cache");
const restrictionsManager = require("../../restrictions/restriction-manager");
const { TriggerType } = require("../../common/EffectType");

const DEFAULT_COOLDOWN_MESSAGE = "This command is still on cooldown for: {timeLeft}";
const DEFAULT_RESTRICTION_MESSAGE = "Sorry, you cannot use this command because: {reason}";

// commandaccess
const commandManager = require("./CommandManager");

// custom command executor
const commandExecutor = require("./command-executor");

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
        return `(?:^|\\s)${escapedTrigger}(?!-)(?:\\b|$|(?=\\s))`;
    }
    return `^${escapedTrigger}(?!-)(?:\\b|$|(?=\\s))`;
}

function testForTrigger(message, trigger, scanWholeMessage, triggerIsRegex) {
    message = message.toLowerCase();

    const normalizedTrigger = trigger.toLowerCase();
    const commandRegexStr = triggerIsRegex
        ? trigger
        : buildCommandRegexStr(normalizedTrigger, scanWholeMessage);

    const regex = new RegExp(commandRegexStr, "gi");

    return regex.test(message);
}

function checkForCommand(rawMessage) {
    if (rawMessage == null || rawMessage.length < 1) {
        return null;
    }

    const allCommands = commandManager.getAllActiveCommands();

    for (const command of allCommands) {

        if (testForTrigger(
            rawMessage,
            command.trigger,
            command.scanWholeMessage,
            command.triggerIsRegex
        )
        ) {
            return { command, matchedTrigger: command.trigger };
        }

        if (!command.triggerIsRegex && command.aliases != null && Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
                if (testForTrigger(
                    rawMessage,
                    alias,
                    command.scanWholeMessage,
                    false
                )) {
                    return { command, matchedTrigger: alias };
                }
            }
        }
    }
    return { command: null };
}

function updateCommandCount(command) {
    if (command.count == null) {
        command.count = 0;
    }
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
    let globalCacheKey = `${command.id}${
        triggeredSubcmd ? `:${triggeredSubcmd.id || triggeredSubcmd.arg}` : ""
    }`;

    let userCacheKey = `${command.id}${
        triggeredSubcmd ? `:${triggeredSubcmd.id || triggeredSubcmd.arg}` : ""
    }:${username}`;

    let remainingGlobal = 0,
        remainingUser = 0;

    let globalCooldown = cooldownCache.get(globalCacheKey);
    if (globalCooldown != null) {
        remainingGlobal = globalCooldown.diff(moment(), "s");
    }

    let userCooldown = cooldownCache.get(userCacheKey);
    if (userCooldown != null) {
        remainingUser = userCooldown.diff(moment(), "s");
    }

    if (remainingUser > 0) {
        return remainingUser;
    } else if (remainingGlobal > 0) {
        return remainingGlobal;
    }
    return 0;
}

/**
 *
 * @param {object} config
 * @param {string} config.commandId
 * @param {string} [config.subcommandId]
 * @param {string} config.username
 * @param {object} config.cooldowns
 * @param {number} [config.cooldowns.global]
 * @param {number} [config.cooldowns.user]
 */
exports.manuallyCooldownCommand = (config) => {
    if (config.commandId == null || config.cooldowns == null ||
        (config.cooldowns.global == null && config.cooldowns.user == null)) {
        return;
    }

    const globalCacheKey = `${config.commandId}${config.subcommandId ? `:${config.subcommandId}` : ''}`;
    const userCacheKey = `${config.commandId}:${config.subcommandId ? `${config.subcommandId}:` : ''}${config.username}`;

    if (config.cooldowns.global > 0) {
        if (cooldownCache.get(globalCacheKey) == null) {
            cooldownCache.set(
                globalCacheKey,
                moment().add(config.cooldowns.global, "s"),
                config.cooldowns.global
            );
        }
    }
    if (config.cooldowns.user > 0 && config.username != null) {
        cooldownCache.set(
            userCacheKey,
            moment().add(config.cooldowns.user, "s"),
            config.cooldowns.user
        );
    }
};

/**
 *
 * @param {object} config
 * @param {string} config.commandId
 * @param {string} [config.subcommandId]
 * @param {string} config.username
 * @param {object} config.cooldowns
 * @param {boolean} [config.cooldowns.global]
 * @param {boolean} [config.cooldowns.user]
 */
exports.manuallyClearCooldownCommand = (config) => {
    if (config.commandId == null || config.cooldowns == null ||
        (config.cooldowns.global == null && config.cooldowns.user == null)) {
        return;
    }

    const globalCacheKey = `${config.commandId}${config.subcommandId ? `:${config.subcommandId}` : ''}`;
    const userCacheKey = `${config.commandId}:${config.subcommandId ? `${config.subcommandId}:` : ''}${config.username}`;

    if (cooldownCache.get(globalCacheKey) !== null && config.cooldowns.global === true) {
        cooldownCache.del(globalCacheKey);
    }

    if (cooldownCache.get(userCacheKey) !== null && config.cooldowns.user === true) {
        cooldownCache.del(userCacheKey);
    }
};

function cooldownCommand(command, triggeredSubcmd, username) {
    let cooldown;
    if (triggeredSubcmd == null || triggeredSubcmd.cooldown == null) {
        cooldown = command.cooldown;
    } else {
        cooldown = triggeredSubcmd.cooldown;
    }
    if (cooldown == null) {
        return 0;
    }
    logger.debug("Triggering cooldown for command");

    let globalCacheKey = `${command.id}${
        triggeredSubcmd ? `:${triggeredSubcmd.id || triggeredSubcmd.arg}` : ""
    }`;

    let userCacheKey = `${command.id}${
        triggeredSubcmd ? `:${triggeredSubcmd.id || triggeredSubcmd.arg}` : ""
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
    firebotChatMessage,
    commandSender,
    isManual = false
) {
    if (command == null) {
        return;
    }
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
            chatMessage: firebotChatMessage
        });
    }
    if (command.effects) {
        logger.info("Executing command effects");
        commandExecutor.execute(command, userCmd, firebotChatMessage, isManual);
    }
}

/**
 * @arg {import('../chat-helpers').FirebotChatMessage} firebotChatMessage
 */
async function handleChatMessage(firebotChatMessage) {

    const twitchChat = require("../twitch-chat");

    logger.debug("Checking for command in message...");

    // Username of the person that sent the command.
    const commandSender = firebotChatMessage.username;

    // Check to see if handled message array contains the id of this message already.
    // If it does, that means that one of the logged in accounts has already handled the message.
    if (handledMessageIds.includes(firebotChatMessage.id)) {
        // We can remove the handled id now, to keep the array small.
        handledMessageIds = handledMessageIds.filter(id => id !== firebotChatMessage.id);
        return false;
    }
    // throw the message id into the array. This prevents both the bot and the streamer accounts from replying
    handledMessageIds.push(firebotChatMessage.id);

    logger.debug("Combining message segments...");
    const rawMessage = firebotChatMessage.rawText;

    // search for and return command if found
    logger.debug("Searching for command...");
    const { command, matchedTrigger } = checkForCommand(rawMessage);

    // command wasn't found
    if (command == null) {
        return false;
    }

    const { streamer, bot } = accountAccess.getAccounts();

    // check if chat came from the bot and if we should ignore it.
    if (command.ignoreBot && firebotChatMessage.username === bot.displayName) {
        logger.debug("Message came from bot and this command is set to ignore it");
        return false;
    }

    // check if chat came from the streamer and if we should ignore it.
    if (command.ignoreStreamer && firebotChatMessage.username === streamer.displayName) {
        logger.debug("Message came from streamer and this command is set to ignore it");
        return false;
    }

    // build usercommand object
    const userCmd = buildUserCommand(command, rawMessage, commandSender, firebotChatMessage.roles);

    // update trigger with the one we matched
    userCmd.trigger = matchedTrigger;

    let triggeredSubcmd = null;
    if (!command.scanWholeMessage && !command.triggerIsRegex && userCmd.args.length > 0 && command.subCommands && command.subCommands.length > 0) {
        for (let subcmd of command.subCommands) {
            if (subcmd.active === false) {
                continue;
            }
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

        if (command.type !== "system" && triggeredSubcmd == null) {
            if (command.fallbackSubcommand == null || !command.fallbackSubcommand.active) {
                twitchChat.sendChatMessage(`Invalid Command: unknown arg used.`);
                return false;
            }
            triggeredSubcmd = command.fallbackSubcommand;
            userCmd.triggeredArg = command.fallbackSubcommand.arg;
            userCmd.subcommandId = command.fallbackSubcommand.id;
        }
    }

    if (command.autoDeleteTrigger || (triggeredSubcmd && triggeredSubcmd.autoDeleteTrigger)) {
        logger.debug("Auto delete trigger is on, attempting to delete chat message");
        twitchChat.deleteMessage(firebotChatMessage.id);
    }

    // check if command meets min args requirement
    const minArgs = triggeredSubcmd ? triggeredSubcmd.minArgs || 0 : command.minArgs || 0;
    if (userCmd.args.length < minArgs) {
        let usage = triggeredSubcmd ? triggeredSubcmd.usage : command.usage;
        twitchChat.sendChatMessage(`Invalid command. Usage: ${command.trigger} ${usage || ""}`);
        return false;
    }

    const restrictionData =
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
                userId: firebotChatMessage.userId,
                userTwitchRoles: firebotChatMessage.roles,
                command: command,
                userCommand: userCmd,
                chatMessage: firebotChatMessage
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
            if (restrictionData.sendFailMessage || restrictionData.sendFailMessage == null) {

                const restrictionMessage = restrictionData.useCustomFailMessage ?
                    restrictionData.failMessage :
                    DEFAULT_RESTRICTION_MESSAGE;

                twitchChat.sendChatMessage(
                    restrictionMessage
                        .replace("{user}", commandSender)
                        .replace("{reason}", reason),
                    null,
                    null,
                    firebotChatMessage.id
                );
            }

            return false;
        }
    }

    logger.debug("Checking cooldowns for command...");
    // Check if the command is on cooldown
    const remainingCooldown = getRemainingCooldown(
        command,
        triggeredSubcmd,
        commandSender
    );

    if (remainingCooldown > 0) {
        logger.debug("Command is still on cooldown, alerting viewer...");
        if (command.sendCooldownMessage || command.sendCooldownMessage == null) {

            const cooldownMessage = command.useCustomCooldownMessage ? command.cooldownMessage : DEFAULT_COOLDOWN_MESSAGE;

            twitchChat.sendChatMessage(
                cooldownMessage
                    .replace("{user}", commandSender)
                    .replace("{timeLeft}", util.secondsForHumans(remainingCooldown)),
                null,
                null,
                firebotChatMessage.id
            );
        }
        return false;
    }

    // add cooldown to cache if commmand has cooldowns set
    cooldownCommand(command, triggeredSubcmd, commandSender);

    //update the count for the command
    if (command.type === "custom") {
        logger.debug("Updating command count.");
        updateCommandCount(command);
    }

    fireCommand(command, userCmd, firebotChatMessage, commandSender, false, false);
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

function runCommandFromEffect(command, trigger, args) {
    let message = command.trigger + " " + args;

    if (command) {
        let userCmd = buildUserCommand(command, message, trigger.metadata.username);
        fireCommand(command, userCmd, message, trigger.metadata.username, false);
    }
}

function runSystemCommandFromEffect(id, trigger, args) {
    let command = commandManager.getSystemCommandById(id).definition;
    runCommandFromEffect(command, trigger, args);
}

function runCustomCommandFromEffect(id, trigger, args) {
    let command = commandManager.getCustomCommandById(id);
    runCommandFromEffect(command, trigger, args);
}

// Refresh command cooldown cache when changes happened on the front end
ipcMain.on("commandManualTrigger", function(event, id) {
    triggerCustomCommand(id, true);
});

// Refresh command cooldown cache when changes happened on the front end
ipcMain.on("refreshCommandCache", function() {
    flushCooldownCache();
});

exports.handleChatMessage = handleChatMessage;
exports.triggerCustomCommand = triggerCustomCommand;
exports.runSystemCommandFromEffect = runSystemCommandFromEffect;
exports.runCustomCommandFromEffect = runCustomCommandFromEffect;
exports.flushCooldownCache = flushCooldownCache;
