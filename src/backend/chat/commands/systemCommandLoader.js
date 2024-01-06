"use strict";

const commandManager = require("./CommandManager");

exports.loadCommands = () => {
    // get command definitions
    const { CommandListSystemCommand } = require("./builtin/command-list");
    const commandManagement = require("./builtin/commandManagement");
    const uptime = require("./builtin/uptime");
    const followage = require("./builtin/followage");
    const quotesManagement = require('./builtin/quotes');
    const currencyManager = require('../../currency/currencyManager');
    const steam = require("./builtin/steam/steam");
    const customRoleManagement = require("./builtin/custom-role-management");
    const marker = require('./builtin/marker');
    const spamRaidProtection = require('./builtin/spam-raid-protection');

    // register them
    commandManager.registerSystemCommand(CommandListSystemCommand);
    commandManager.registerSystemCommand(commandManagement);
    commandManager.registerSystemCommand(uptime);
    commandManager.registerSystemCommand(followage);
    commandManager.registerSystemCommand(quotesManagement);
    commandManager.registerSystemCommand(steam);
    commandManager.registerSystemCommand(customRoleManagement);
    commandManager.registerSystemCommand(marker);
    commandManager.registerSystemCommand(spamRaidProtection);

    currencyManager.createAllCurrencyCommands();
};
