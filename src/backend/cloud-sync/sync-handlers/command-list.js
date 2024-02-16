"use strict";

const commandManager = require("../../chat/commands/command-manager");

async function getCommandListForSync() {
    const allCommands = commandManager.getAllActiveCommands();
    const commandData = {
        'allowedCmds': []
    };

    // Filter!
    commandData.allowedCmds = allCommands
        .filter(c => c.active && !c.hidden)
        .map((c) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { effects, ...strippedCommand } = c;

            if (strippedCommand.fallbackSubcommand) {
                strippedCommand.fallbackSubcommand.effects = undefined;
            }

            return {
                ...strippedCommand,
                fallbackSubcommand: strippedCommand.fallbackSubcommand
                    && !strippedCommand.fallbackSubcommand.hidden
                    && strippedCommand.fallbackSubcommand.active ?
                    strippedCommand.fallbackSubcommand : null,
                subCommands: strippedCommand.subCommands
                    ? strippedCommand.subCommands
                        .filter(sc => sc.active && !sc.hidden)
                        .map((sc) => {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { effects, ...strippedSubCommand } = sc;
                            return strippedSubCommand;
                        })
                    : null
            };
        });


    if (commandData.allowedCmds.length < 1) {
        return null;
    }

    return commandData;
}

exports.getCommandListForSync = getCommandListForSync;