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
    description: "Lists all commands the user has permissions for.",
    autoDeleteTrigger: true,
    scanWholeMessage: false,
    cooldown: {
      user: 5,
      global: 2
    },
    permission: {
      type: "none"
    },
    subCommands: [
      {
        arg: "test",
        description: "Test subcommand, this does nothing",
        usage: "test @username",
        permission: {
          type: "individual",
          username: "test"
        },
        cooldown: {
          user: 60,
          global: 0
        }
      }
    ]
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
