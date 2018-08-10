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
        arg: "cooldown",
        usage: "cooldown [!trigger or word] [globalCooldown] [userCooldown]",
        description: "Change the cooldown for a command."
      },
      {
        arg: "restrict",
        usage:
          "restrict [!trigger or word] [All/Sub/Mod/ChannelEditor/Streamer]",
        description:
          "Update permissions for a command: All/Sub/Mod/ChannelEditor/Streamer"
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
      const permissionsManager = require("../../../common/permissions-manager");

      const Chat = require("../../../common/mixer-chat");

      let allCommands = commandManager.getAllActiveCommands();

      let allowedCmds = [];

      for (let cmd of allCommands) {
        let userHasPermission = await permissionsManager.userHasPermission(
          event.userCommand.commandSender,
          event.chatEvent.user_roles,
          cmd.permission
        );

        if (userHasPermission) {
          allowedCmds.push(cmd.trigger);
        }
      }

      if (allowedCmds.length < 1) {
        Chat.smartSend(
          "There are no commands that you are allowed to run.",
          event.userCommand.commandSender
        );
      } else {
        Chat.smartSend(
          `Commands you can run: ${allowedCmds.join(", ")}`,
          event.userCommand.commandSender
        );
      }
    });
  }
};

module.exports = commandList;
