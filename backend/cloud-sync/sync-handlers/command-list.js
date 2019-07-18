"use strict";

const commandManager = require("../../chat/commands/CommandManager");
const permissionsManager = require("../../common/permissions-manager");

async function getCommandListForSync(username, userRoles) {
    let allCommands = commandManager.getAllActiveCommands();
    let commandData = {
        'allowedCmds': []
    };

    for (let cmd of allCommands) {
        if (username == null || userRoles == null) {
            commandData.allowedCmds.push(cmd);
        } else {
            let userHasPermission = await permissionsManager.userHasPermission(
                username,
                userRoles,
                cmd.permission
            );

            if (userHasPermission && cmd.active !== false) {
                commandData.allowedCmds.push(cmd);
            }
        }
    }

    // Filter!
    commandData.allowedCmds = commandData.allowedCmds.map(c => {
        return {trigger: c.trigger, description: c.description};
    });


    if (commandData.allowedCmds.length < 1) {
        return null;
    }

    return commandData;
}

exports.getCommandListForSync = getCommandListForSync;