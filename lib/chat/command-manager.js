"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const commandAccess = require("../data-access/command-access");
const permissionsManager = require("../common/permissions-manager");
const mixerChat = require("../common/mixer-chat");
const util = require("../utility");
const moment = require("moment");
const NodeCache = require("node-cache");

// command exectutors
const customCommandExecutor = require("./commandExecutors/customCommandExectutor");

const cooldownCache = new NodeCache({ stdTTL: 1, checkperiod: 1 });

const handledMessageIds = [];

function checkForCommand(rawMessage) {
  let normalziedRawMessage = rawMessage.toLowerCase();

  let activeSystemCommands = commandAccess.getSystemCommands.filter(
      c => c.active
    ),
    activeCustomCommands = commandAccess.getCustomCommands.filter(
      c => c.active
    ),
    allCommands = activeSystemCommands.concat(activeCustomCommands);

  for (command of allCommands) {
    let normalizedTrigger = command.trigger.toLowerCase();
    if (command.scanWholeMessage) {
      if (normalziedRawMessage.contains(normalizedTrigger)) {
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

function buildUserCommand(command, rawMessage, commandSender) {
  let userCmd = {
    trigger: "",
    args: [],
    commandSender: commandSender
  };
  if (command.scanWholeMessage) {
    userCmd.trigger = command.trigger;
    if (rawMessage != null) {
      userCmd.args = rawMessage.split(" ");
    }
  } else {
    let rawArgs = rawMessage.split(" ");
    if (rawArgs.length > 0) {
      userCmd.trigger = rawArgs[0];
      userCmd.args = rawArgs.splice(1);
    }
  }
  return userCmd;
}

function flushCooldownCache() {}

function getRemainingCooldown(command, username) {
  let remainingGlobal = 0,
    remainingUser = 0;

  if (command.cooldowns.global > 0) {
    let globalCooldown = cooldownCache.get(command.id);
    if (globalCooldown != null) {
      remainingGlobal = globalCooldown.diff(moment(), "s");
    }
  }
  if (command.cooldowns.user > 0) {
    let userCooldown = cooldownCache.get(command.id + ":" + username);
    if (userCooldown != null) {
      remainingUser = userCooldown.diff(moment(), "s");
    }
  }

  if (remainingGlobal > 0) {
    return remainingGlobal;
  } else if (remainingUser > 0) {
    return remainingUser;
  }
  return 0;
}

function cooldownCommand(command, username) {
  if (command.cooldowns.global > 0) {
    if (cooldownCache.get(command.id) == null) {
      cooldownCache.set(
        command.id,
        moment().add(command.cooldowns.global, "s")
      );
    }
  }
  if (command.cooldowns.user > 0) {
    cooldownCache.set(
      command.id + ":" + username,
      moment().add(command.cooldowns.user, "s")
    );
  }
}

async function handleChatEvent(chatEvent, chatter) {
  let isWhisper = chatEvent.message.meta.whisper === true,
    commandSender = chatEvent.user_name; // Username of the person that sent the command.

  // If the chat came from a bot, ignore it.
  if (chatEvent.user_name === botName || (chatter === "bot" && !isWhisper)) {
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

  // Check if the user has permission
  let userHasPermission = await permissionsManager.userHasPermission(
    commandSender,
    chatEvent.user_roles,
    command.permission
  );

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

  // build usercommand object
  let userCmd = buildUserCommand(command, rawMessage, commandSender);

  if (command.type === "system") {
    // TODO: send system commands to their respective command exectutors
  } else if (command.type === "custom") {
    customCommandExecutor.execute(command, userCmd, chatEvent, false);
  }

  return true;
}

// Refresh command cooldown cache when changes happened on the front end
ipcMain.on("refreshCommandCache", function() {
  flushCooldownCache();
});

exports.handleChatEvent = handleChatEvent;
