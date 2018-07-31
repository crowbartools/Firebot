"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const permissionsManager = require("../../common/permissions-manager");
const accountAccess = require("../../common/account-access");
const mixerChat = require("../../common/mixer-chat");
const util = require("../../utility");
const moment = require("moment");
const NodeCache = require("node-cache");

// commandaccess
const commandAccess = require("../../data-access/command-access");
const commandManager = require("./commandManager");

// custom command exectutor
const customCommandExecutor = require("./customCommandExectutor");

const cooldownCache = new NodeCache({ stdTTL: 1, checkperiod: 1 });

const handledMessageIds = [];

/**
 * A command issued by a user(viewer)
 *
 * @param {string} trigger the word that triggered the command
 * @param {string[]} args List of args the user provided with the command
 * @param {string} commandSender username of the person who issued the command
 */
function UserCommand(trigger, args, commandSender) {
  this.trigger = trigger;
  this.args = args;
  this.commandSender = commandSender;
}

function checkForCommand(rawMessage) {
  let normalziedRawMessage = rawMessage.toLowerCase();

  let allCommands = commandManager.getAllActiveCommands();

  for (let command of allCommands) {
    let normalizedTrigger = command.trigger.toLowerCase();
    if (command.scanWholeMessage) {
      if (normalziedRawMessage.includes(normalizedTrigger)) {
        return command;
      }
    } else {
      if (normalziedRawMessage.startsWith(normalizedTrigger)) {
        return command;
      }
    }
  }

  return null;
}

function flushCooldownCache() {
  cooldownCache.flushAll();
}

function getRemainingCooldown(command, username) {
  if (command.cooldown == null) return 0;

  let remainingGlobal = 0,
    remainingUser = 0;

  if (command.cooldown.global > 0) {
    let globalCooldown = cooldownCache.get(command.id);
    if (globalCooldown != null) {
      remainingGlobal = globalCooldown.diff(moment(), "s");
    }
  }
  if (command.cooldown.user > 0) {
    let userCooldown = cooldownCache.get(command.id + ":" + username);
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

function cooldownCommand(command, username) {
  if (command.cooldown == null) return 0;

  if (command.cooldown.global > 0) {
    if (cooldownCache.get(command.id) == null) {
      cooldownCache.set(
        command.id,
        moment().add(command.cooldown.global, "s"),
        command.cooldown.global
      );
    }
  }
  if (command.cooldown.user > 0) {
    cooldownCache.set(
      command.id + ":" + username,
      moment().add(command.cooldown.user, "s"),
      command.cooldown.user
    );
  }
}

function buildUserCommand(command, rawMessage, sender) {
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

  return new UserCommand(trigger, args, commandSender);
}

function fireCommand(
  command,
  chatEvent,
  rawMessage,
  commandSender,
  isManual = false
) {
  if (command == null) return;
  if (commandSender == null) {
    commandSender = accountAccess.getAccounts().streamer.username;
  }

  // build usercommand object
  let userCmd = buildUserCommand(command, rawMessage, commandSender);

  logger.info("checking command type");

  if (command.type === "system") {
    //get system command from manager
    let cmdDef = commandManager.getSystemCommandById(command.id);

    //call trigger event.
    cmdDef.onTriggerEvent({
      command: command,
      userCmd: userCmd,
      chatEvent: chatEvent
    });
  } else if (command.type === "custom") {
    logger.info("executing custom command");
    customCommandExecutor.execute(command, userCmd, chatEvent, false, isManual);
  }
}

async function handleChatEvent(chatEvent, chatter) {
  let isWhisper = chatEvent.message.meta.whisper === true,
    commandSender = chatEvent.user_name; // Username of the person that sent the command.

  // If the chat came from a bot, ignore it.
  if (
    chatEvent.user_name === accountAccess.getAccounts().bot.username ||
    (chatter === "bot" && !isWhisper)
  ) {
    return false;
  }

  // Check to see if handled message array contains the id of this message already.
  // If it does, that means that one of the logged in accounts has already handled the message.
  if (handledMessageIds.includes(chatEvent.id)) {
    // We can remove the handled id now, to keep the array small.
    handledMessageIds = handledMessageIds.filter(id => id !== chatEvent.id);
    return false;
  }
  // throw the message id into the array. This prevents both the bot and the streamer accounts from replying
  handledMessageIds.push(chatEvent.id);

  let rawMessage = "";
  chatEvent.message.message.forEach(m => {
    rawMessage += m.text;
  });

  // search for and return command if found
  let command = checkForCommand(rawMessage);

  // command wasnt found
  if (command == null) return false;

  if (command.autoDeleteTrigger) {
    mixerChat.deleteChat(chatEvent.id);
  }

  // Check if the user has permission for base command
  let userHasPermission = await permissionsManager.userHasPermission(
    commandSender,
    chatEvent.user_roles,
    command.permission
  );

  // build usercommand object
  let userCmd = buildUserCommand(command, rawMessage, commandSender);

  // check perms for sub commands
  if (
    userHasPermission &&
    !command.scanWholeMessage &&
    userCmd.args.length > 0
  ) {
    for (let subcmd of command.subCommands) {
      if (subcmd.arg.toLowerCase() === userCmd.args[0].toLowerCase()) {
        userHasPermission = await permissionsManager.userHasPermission(
          commandSender,
          chatEvent.user_roles,
          subcmd.permission
        );
        break;
      }
    }
  }

  if (!userHasPermission) {
    mixerChat.smartSend(
      "You do not have permission to run this command.",
      commandSender
    );
    return false;
  }

  // Check if the command is on cooldown
  let remainingCooldown = getRemainingCooldown(command, commandSender);

  if (remainingCooldown > 0) {
    mixerChat.smartSend(
      "This command is still on cooldown for: " +
        util.secondsForHumans(remainingCooldown),
      commandSender
    );
    return false;
  }

  // add cooldown to cache if commmand has cooldowns set
  cooldownCommand(command, commandSender);

  // Log the action in Firebot's log.
  if (command.skipLog !== true) {
    renderWindow.webContents.send("eventlog", {
      type: "general",
      username: commandSender,
      event: "used the " + command.trigger + " command."
    });
  }

  // Throw chat alert if we have it active.
  if (command.chatFeedAlert === true) {
    renderWindow.webContents.send("chatUpdate", {
      fbEvent: "ChatAlert",
      message: commandSender + " used the " + command.trigger + " command."
    });
  }

  fireCommand(command, chatEvent, rawMessage, commandSender, false, false);
  return true;
}

function triggerCustomCommand(id, isManual) {
  let command = commandAccess.getCustomCommand(id);
  console.log("firing command manually", command);
  fireCommand(command, null, null, null, isManual);
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
