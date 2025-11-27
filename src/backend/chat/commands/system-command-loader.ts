import { CommandManager } from "./command-manager";
import currencyCommandManager from '../../currency/currency-command-manager';
import rankCommandManager from "../../ranks/rank-command-manager";

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
    CommandManager.registerSystemCommand(CommandListSystemCommand);
    CommandManager.registerSystemCommand(CommandManagementSystemCommand);
    CommandManager.registerSystemCommand(CustomRoleManagementSystemCommand);
    CommandManager.registerSystemCommand(FollowAgeSystemCommand);
    CommandManager.registerSystemCommand(MarkerSystemCommand);
    CommandManager.registerSystemCommand(QuotesManagementSystemCommand);
    CommandManager.registerSystemCommand(SpamRaidProtectionSystemCommand);
    CommandManager.registerSystemCommand(SteamSystemCommand);
    CommandManager.registerSystemCommand(UptimeSystemCommand);

    currencyCommandManager.createAllCurrencyCommands();

    rankCommandManager.createAllRankLadderCommands();
}