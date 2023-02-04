"use strict";

const commandManager = require("./CommandManager");

exports.loadCommands = () => {
    // get command definitions
    const commandList = require("./builtin/commandList");
    const commandManagement = require("./builtin/commandManagement");
    const uptime = require("./builtin/uptime");
    const followage = require("./builtin/followage");
    const quotesManagement = require('./builtin/quotes');
    const currencyManager = require('../../currency/currencyManager');
    const steam = require("./builtin/steam/steam");
    const customRoleManagement = require("./builtin/custom-role-management");
    const marker = require('./builtin/marker');
    const spamRaidProtection = require('./builtin/spam-raid-protection');
    const { QueueSystemCommandType } = require("./builtin/queue");

    // register them
    commandManager.registerSystemCommand(commandList);
    commandManager.registerSystemCommand(commandManagement);
    commandManager.registerSystemCommand(uptime);
    commandManager.registerSystemCommand(followage);
    commandManager.registerSystemCommand(quotesManagement);
    commandManager.registerSystemCommand(steam);
    commandManager.registerSystemCommand(customRoleManagement);
    commandManager.registerSystemCommand(marker);
    commandManager.registerSystemCommand(spamRaidProtection);
    commandManager.registerSystemCommand(QueueSystemCommandType);

    currencyManager.createAllCurrencyCommands();
};