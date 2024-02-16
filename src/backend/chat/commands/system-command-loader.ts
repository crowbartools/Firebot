import commandManager from "./command-manager";
import currencyCommandManager from '../../currency/currency-command-manager';

import { CommandListSystemCommand } from "./builtin/command-list";
import { CommandManagementSystemCommand } from "./builtin/command-management";
import { CustomRoleManagementSystemCommand } from "./builtin/custom-role-management";
import { FollowAgeSystemCommand } from "./builtin/follow-age";
import { MarkerSystemCommand } from './builtin/marker';
import { QuotesManagementSystemCommand } from './builtin/quotes';
import { SpamRaidProtectionSystemCommand } from './builtin/spam-raid-protection';
import { SteamSystemCommand } from "./builtin/steam/steam";
import { UptimeSystemCommand } from "./builtin/uptime";

/**
 * Loads all in-box system commands, along with any currency commands
 */
export function loadSystemCommands() {
    commandManager.registerSystemCommand(CommandListSystemCommand);
    commandManager.registerSystemCommand(CommandManagementSystemCommand);
    commandManager.registerSystemCommand(CustomRoleManagementSystemCommand);
    commandManager.registerSystemCommand(FollowAgeSystemCommand);
    commandManager.registerSystemCommand(MarkerSystemCommand);
    commandManager.registerSystemCommand(QuotesManagementSystemCommand);
    commandManager.registerSystemCommand(SpamRaidProtectionSystemCommand);
    commandManager.registerSystemCommand(SteamSystemCommand);
    commandManager.registerSystemCommand(UptimeSystemCommand);

    currencyCommandManager.createAllCurrencyCommands();
}