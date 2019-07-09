"use strict";

const commandManager = require("../../chat/commands/CommandManager");
const permissionsManager = require("../../common/permissions-manager");
const cloudSync = require("../../cloud-sync/cloud-sync");
const accountAccess = require('../../common/account-access');
const logger = require("../../logwrapper");

async function getCommandListSyncId(username, userRoles) {
    let allCommands = commandManager.getAllActiveCommands();
    let streamerUsername = accountAccess.getAccounts().streamer.username;
    let commandData = {
        'owner': streamerUsername,
        'chatter': username,
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

    if (commandData.allowedCmds.length < 1) {
        return null;
    }

    let binId = await cloudSync.sync(commandData);

    if (binId !== false) {
        return binId;
    }

    logger.error('Cloud Sync: Unable to get binId from bytebin.');
    return null;
}

exports.getCommandListSyncId = getCommandListSyncId;