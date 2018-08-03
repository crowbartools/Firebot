"use strict";

/**
 * The Uptime command
 */
const uptime = {
  definition: {
    id: "firebot:uptime",
    name: "Uptime",
    active: true,
    trigger: "!uptime",
    description: "Displays how long the stream has been live in chat.",
    autoDeleteTrigger: false,
    scanWholeMessage: false,
    cooldown: {
      user: 0,
      global: 3
    },
    permission: {
      type: "none"
    },
    subCommands: []
  },
  /**
   * When the command is triggered
   */
  onTriggerEvent: event => {
    return new Promise((resolve, reject) => {
      console.log("uptime worked");
    });
  }
};

module.exports = uptime;
