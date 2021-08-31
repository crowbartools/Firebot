"use strict";

const logger = require("../../../../logwrapper");
const commandManager = require("../../../commands/CommandManager");
const frontendCommunicator = require("../../../../common/frontend-communicator");

const PERMIT_COMMAND_ID = "firebot:moderation:url:permit";
let tempPermittedUsers = [];

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
        restrictionData: {
            restrictions: [
                {
                    id: "sys-cmd-mods-only-perms",
                    type: "firebot:permissions",
                    mode: "roles",
                    roleIds: [
                        "broadcaster",
                        "mod"
                    ]
                }
            ]
        },
        options: {
            permitDuration: {
                type: "number",
                title: "Duration in seconds",
                default: 30,
                description: "The amount of time the viewer has to post a link after the !permit command is used."
            },
            permitDisplayTemplate: {
                type: "string",
                title: "Output Template",
                description: "The chat message shown when the permit command is used (leave empty for no message).",
                tip: "Variables: {target}, {duration}",
                default: `{target}, you have {duration} seconds to post your url in the chat.`,
                useTextArea: true
            }
        }
    },
    onTriggerEvent: async event => {
        const twitchChat = require("../twitch-chat");
        const { commandOptions } = event;
        const target = event.userCommand.args[0].replace("@", "");

        if (!target) {
            twitchChat.sendChatMessage("Please specify a user to permit.");
            return;
        }

        tempPermittedUsers.push(target);
        logger.debug(`Url moderation: ${target} has been temporary permitted to post a url...`);

        const message = commandOptions.permitDisplayTemplate.replace("{target}", target).replace("{duration}", commandOptions.permitDuration);

        if (message) {
            twitchChat.sendChatMessage(message);
        }

        setTimeout(() => {
            tempPermittedUsers = tempPermittedUsers.filter(user => user !== target);
            logger.debug(`Url moderation: Temporary url permission for ${target} expired.`);
        }, commandOptions.permitDuration * 1000);
    }
};

function hasTemporaryPermission(username) {
    return tempPermittedUsers.includes(username);
}

function registerPermitCommand() {
    if (!commandManager.hasSystemCommand(PERMIT_COMMAND_ID)) {
        commandManager.registerSystemCommand(permitCommand);
    }
}

function unregisterPermitCommand() {
    commandManager.unregisterSystemCommand(PERMIT_COMMAND_ID);
}

frontendCommunicator.on("registerPermitCommand", () => {
    registerPermitCommand();
});

frontendCommunicator.on("unregisterPermitCommand", () => {
    unregisterPermitCommand();
});

exports.hasTemporaryPermission = hasTemporaryPermission;
exports.registerPermitCommand = registerPermitCommand;
exports.unregisterPermitCommand = unregisterPermitCommand;