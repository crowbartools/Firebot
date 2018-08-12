"use strict";

/**
 * The Command List command
 */
const commandList = {
  definition: {
    id: "firebot:commandmanagement",
    name: "Command Management",
    active: true,
    trigger: "!command",
    description: "Allows custom command management via chat.",
    autoDeleteTrigger: true,
    scanWholeMessage: false,
    cooldown: {
      user: 0,
      global: 0
    },
    permission: {
      type: "group",
      groups: ["Channel Editors", "Streamer"]
    },
    subCommands: [
      {
        arg: "add",
        usage: "add [!trigger or word] [message]",
        description: "Adds a new command with a given response message."
      },
      {
        arg: "response",
        usage: "response [!trigger or word] [message]",
        description:
          "Updates the response message for a command. Only works for commands that have 1 or 0 chat effects."
      },
      {
        arg: "cooldown",
        usage: "cooldown [!trigger or word] [globalCooldown] [userCooldown]",
        description: "Change the cooldown for a command."
      },
      {
        arg: "restrict",
        usage:
          "restrict [!trigger or word] [All/Sub/Mod/ChannelEditor/Streamer]",
        description: "Update permissions for a command."
      },
      {
        arg: "remove",
        usage: "remove [!trigger or word]",
        description: "Removes the given command."
      }
    ]
  },
  /**
   * When the command is triggered
   */
  onTriggerEvent: event => {
    return new Promise(async (resolve, reject) => {
      const commandManager = require("../CommandManager");
      const Chat = require("../../../common/mixer-chat");

      let activeCustomCommands = commandManager
        .getAllCustomCommands()
        .filter(c => c.active);

      let triggeredArg = event.userCommand.triggeredArg;

      let usage = event.command.usage;
      if (triggeredArg != null) {
        let subCommand = event.command.subCommands.filter(
          sc => sc.arg === triggeredArg
        );
        if (subCommand != null) {
          usage = subCommand.usage;
        }
      }
      if (arg.length < 2) {
        Chat.smartSend(
          `Invalid command. Usage: ${event.command.trigger} ${usage}`,
          event.userCommand.commandSender
        );
      }

      switch (triggeredArg) {
        case "add":
          break;
        case "response":
          break;
        case "cooldown":
          break;
        case "restrict":
          break;
        case "remove":
          break;
        default:
      }

      console.log(event);
    });
  }
};

module.exports = commandList;
