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
        description:
      "Whispers a list of all commands the user has permission to run.",
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
        return new Promise(async (resolve) => {
            const cloudSyncCommands = require('../../../cloud-sync/commands/command-list');
            const Chat = require("../../../common/mixer-chat");

            let username = event.chatEvent.user_name;
            let userRoles = event.chatEvent.user_roles;

            let binId = await cloudSyncCommands.getCommandListSyncId(username, userRoles);

            if (binId == null) {
                Chat.smartSend(
                    "There are no commands that you are allowed to run.",
                    event.userCommand.commandSender
                );
            } else {
                Chat.smartSend(
                    `Here a list of the commands you can use. https://crowbartools.com/tools/firebot/commands/?id=${binId}`,
                    event.userCommand.commandSender
                );
            }
            resolve();
        });
    }
};

module.exports = commandList;
