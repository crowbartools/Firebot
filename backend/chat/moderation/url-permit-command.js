"use strict";

const util = require("../../utility");
const twitchChat = require("../twitch-chat");
const commandManager = require("../commands/CommandManager");

const PERMIT_COMMAND_ID = "firebot:moderation:url:permit";

const permitCommand = {
    definition: {
        id: PERMIT_COMMAND_ID,
        name: "Permit",
        active: true,
        trigger: "!permit",
        usage: "[target]",
        description: "Permits a viewer to post a url for a set duration (see Moderation -> Url Moderation).",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        hideCooldowns: true,
        options: {
            permitDurationTemplate: {
                type: "number",
                title: "Duration in seconds",
                description: "The amount of time the viewer has to post a link after the !permit command is used."
            },
            permitDisplayTemplate: {
                type: "string",
                title: "Output Template",
                description: "How the permit message is formatted",
                tip: "Variables: {target}, {duration}",
                default: `{target}, you have {duration} seconds to post your url in the chat.`,
                useTextArea: true
            }
        }
    },
    onTriggerEvent: async event => {
        const { commandOptions } = event;
        const target = event.userCommand.args[0];
        const message = commandOptions.permitDisplayTemplate.replace("{target}", target).replace("{duration}", commandOptions.permitDurationTemplate);

        console.log(event);

        twitchChat.sendChatMessage(message);
    }
};

function registerPermitCommand() {
    if (!commandManager.hasSystemCommand(PERMIT_COMMAND_ID)) {
        commandManager.registerSystemCommand(permitCommand);
    }
}

function unregisterPermitCommand() {
    commandManager.unregisterSystemCommand(PERMIT_COMMAND_ID);
}

exports.registerPermitCommand = registerPermitCommand;
exports.unregisterPermitCommand = unregisterPermitCommand;