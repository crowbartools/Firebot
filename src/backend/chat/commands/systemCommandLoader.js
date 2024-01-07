"use strict";

export function loadCommands() {
    const commandManager = require("./CommandManager");

    // get command definitions
    const { CommandListSystemCommand } = require("./builtin/command-list");
    const { CommandManagementSystemCommand } = require("./builtin/command-management");
    const { UptimeSystemCommand } = require("./builtin/uptime");
    const { FollowAgeSystemCommand } = require("./builtin/follow-age");
    const { QuotesManagementSystemCommand } = require('./builtin/quotes');
    const { SteamSystemCommand } = require("./builtin/steam/steam");
    const { CustomRoleManagementSystemCommand } = require("./builtin/custom-role-management");
    const { MarkerSystemCommand } = require('./builtin/marker');
    const { SpamRaidProtectionSystemCommand } = require('./builtin/spam-raid-protection');

    // register them
    commandManager.registerSystemCommand(CommandListSystemCommand);
    commandManager.registerSystemCommand(CommandManagementSystemCommand);
    commandManager.registerSystemCommand(UptimeSystemCommand);
    commandManager.registerSystemCommand(FollowAgeSystemCommand);
    commandManager.registerSystemCommand(QuotesManagementSystemCommand);
    commandManager.registerSystemCommand(SteamSystemCommand);
    commandManager.registerSystemCommand(CustomRoleManagementSystemCommand);
    commandManager.registerSystemCommand(MarkerSystemCommand);
    commandManager.registerSystemCommand(SpamRaidProtectionSystemCommand);

    const currencyManager = require('../../currency/currencyManager');
    currencyManager.createAllCurrencyCommands();
}