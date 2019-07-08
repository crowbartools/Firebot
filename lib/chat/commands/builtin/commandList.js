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
        return new Promise(async (resolve, reject) => {
            const commandManager = require("../CommandManager");
            const permissionsManager = require("../../../common/permissions-manager");
            const cloudSync = require("../../../cloud-sync/cloud-sync");

            const Chat = require("../../../common/mixer-chat");

            let allCommands = commandManager.getAllActiveCommands();

            let allowedCmds = [];

            for (let cmd of allCommands) {
                let userHasPermission = await permissionsManager.userHasPermission(
                    event.userCommand.commandSender,
                    event.chatEvent.user_roles,
                    cmd.permission
                );

                if (userHasPermission && cmd.active !== false) {
                    allowedCmds.push(cmd);
                }
            }

            if (allowedCmds.length < 1) {
                Chat.smartSend(
                    "There are no commands that you are allowed to run.",
                    event.userCommand.commandSender
                );
            } else {
                cloudSync.sync(allowedCmds).then(binId => {
                    if(binId !== false){
                        Chat.smartSend(
                            `Here a list of the commands you can use. https://bytebin.lucko.me/${binId}`,
                            event.userCommand.commandSender
                        );
                    } else {
                        Chat.smartSend(
                            `Oops! There was an error getting the commands you can use!`,
                            event.userCommand.commandSender
                        );
                    }
                });
            }
        });
    }
};

module.exports = commandList;
