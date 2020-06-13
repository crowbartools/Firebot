"use strict";
const path = require("path");
const logger = require("../../../logwrapper");
const importHelpers = require("../import-helpers");

const commandAccess = require("../../../chat/commands/command-access");

const effectsMapper = require("../v4-effect-mapper");
const permissionMapper = require("../v4-permission-mapper");

async function checkForV4Commands() {
    const v4CommandsPath = path.join(importHelpers.v4DataPath, "/chat/commands.json");
    const v4CommandsDetected = await importHelpers.pathExists(v4CommandsPath);
    return v4CommandsDetected;
}

function mapCommands(v4Commands, activeStatus = true, incompatibilityWarnings) {
    for (let v4Command of v4Commands) {
        let v5Command = {
            active: activeStatus,
            cooldown: {
                global: v4Command.cooldown && !isNaN(v4Command.cooldown) ? parseInt(v4Command.cooldown) : 0,
                user: 0
            },
            trigger: v4Command.trigger || "!unknowntrigger",
            effects: {}
        };

        if (v4Command.effects != null) {
            let effectsMapResult = effectsMapper.mapV4EffectList(v4Command.effects, { type: "Chat Command", name: v4Command.trigger });
            if (effectsMapResult) {
                v5Command.effects = effectsMapResult.effects;
                effectsMapResult.incompatibilityWarnings.forEach(w => incompatibilityWarnings.push(w));
            }
        }

        let restrictionData = permissionMapper.mapV4Permissions(v4Command.permissionType, v4Command.permissions);
        v5Command.restrictionData = restrictionData;

        commandAccess.saveNewCustomCommand(v5Command);
    }

}

exports.run = async () => {
    let incompatibilityWarnings = [];

    let foundCommandsFile = await checkForV4Commands();

    if (foundCommandsFile) {
        let v4Commands;
        try {
            let v4CommandsDb = importHelpers.getJsonDbInV4Data("/chat/commands.json");
            v4Commands = v4CommandsDb.getData("/");
        } catch (err) {
            logger.warn("Error while attempting to load v4 commands db.", err);
        }

        if (v4Commands != null) {
            let activeCommandsObj = v4Commands["Active"];
            if (activeCommandsObj != null) {
                let activeCommands = Object.values(activeCommandsObj);
                mapCommands(activeCommands, true, incompatibilityWarnings);
            }

            let inactiveCommandsObj = v4Commands["Inactive"];
            if (inactiveCommandsObj != null) {
                let inactiveCommands = Object.values(inactiveCommandsObj);
                mapCommands(inactiveCommands, false, incompatibilityWarnings);
            }

            commandAccess.triggerUiRefresh();
        }
    }

    return {
        success: true,
        incompatibilityWarnings: incompatibilityWarnings
    };
};