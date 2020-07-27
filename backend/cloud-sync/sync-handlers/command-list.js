"use strict";

const commandManager = require("../../chat/commands/CommandManager");
const restrictionsManager = require("../../restrictions/restriction-manager");

async function getCommandListForSync(username, userRoles) {
    let allCommands = commandManager.getAllActiveCommands();
    let commandData = {
        'allowedCmds': []
    };

    for (let cmd of allCommands) {
        if (!cmd.active || cmd.hidden) continue;
        commandData.allowedCmds.push(cmd);
        /*if (username == null || userRoles == null) {
            commandData.allowedCmds.push(cmd);
        } else {

            let userHasPermission = await restrictionsManager
                .checkPermissionsPredicateOnly(cmd.restrictionData, username, userRoles);

            if (userHasPermission && cmd.active !== false) {
                commandData.allowedCmds.push(cmd);
            }
        }*/
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