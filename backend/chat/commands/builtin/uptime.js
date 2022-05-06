"use strict";

const util = require("../../../utility");
const chat = require("../../twitch-chat");

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
        },
        options: {
            uptimeDisplayTemplate: {
                type: "string",
                title: "Output Template",
                description: "How the uptime message is formatted",
                tip: "Variables: {uptime}",
                default: `Broadcasting time: {uptime}`,
                useTextArea: true
            }
        }
    },
    /**
     * When the command is triggered
     */
    onTriggerEvent: async event => {
        const uptimeString = await util.getUptime();
        const { commandOptions } = event;
        chat.sendChatMessage(commandOptions.uptimeDisplayTemplate
            .replace("{uptime}", uptimeString));
    }
};

module.exports = model;
