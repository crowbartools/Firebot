"use strict";

/**
 * The Command List command
 */
const commandList = {
  definition: {
    id: "firebot:commandlist",
    name: "Command List",
    active: true,
    trigger: "!commands",
    description: "List all commands the user has permissions for.",
    autoDeleteTrigger: true,
    scanWholeMessage: true,
    cooldown: {
      user: 1,
      global: 2
    },
    permission: {
      type: "none"
    }
  },
  /**
   * When the command is triggered
   */
  onTriggerEvent: event => {
    return new Promise((resolve, reject) => {
      console.log("worked");
    });
  }
};

module.exports = commandList;
