"use strict";

const util = require("../../../utility");
const chat = require("../../chat");

/**
 * The Uptime command
 */
const model = {
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
        }
    },
    /**
   * When the command is triggered
   */
    onTriggerEvent: async () => {
        let uptimeString = await util.getUptime();
        chat.sendChatMessage(`Broadcasting time: ${uptimeString}`);
    }
};

module.exports = model;
