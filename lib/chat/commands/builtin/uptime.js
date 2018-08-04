"use strict";

const util = require("../../../utility");
const Chat = require("../../../common/mixer-chat");

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
      global: 0
    },
    permission: {
      type: "none"
    }
  },
  /**
   * When the command is triggered
   */
  onTriggerEvent: event => {
    return new Promise(async (resolve, reject) => {
      let uptimeString = await util.getUptime();

      Chat.smartSend(`Broadcasting time: ${uptimeString}`);
    });
  }
};

module.exports = uptime;
