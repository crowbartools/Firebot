import { randomUUID } from "crypto";

import type { SystemCommand } from "../../../../types/commands";
import type { EffectInstance } from "../../../../types/effects";
import type { Restriction } from "../../../../types/restrictions";

import { CommandManager } from "../command-manager";
import { SettingsManager } from "../../../common/settings-manager";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";
import customRolesManager from "../../../roles/custom-roles-manager";
import teamRolesManager from "../../../roles/team-roles-manager";
import frontendCommunicator from "../../../common/frontend-communicator";
import { capitalize } from "../../../utils";
import { getData } from "../../../cloud-sync";

interface TriggerWithArgs {
    trigger: string;
    remainingData: string;
}

interface SharedEffects {
    effects: EffectInstance[];
}

function separateTriggerFromArgs(args: string[]): TriggerWithArgs {
    let trigger: string, remainingData = "";
    if (args[1].startsWith("\"")) {
        const combined = args.slice(1).join(" ");
        const quotedTriggerRegex = /(?<=(?:\s|^)")(?:[^"]|(?:\\"))*(?=(?:(?:"(?<!\\"))(?:\s|$)))/i;
        const results = quotedTriggerRegex.exec(combined);

        if (results === null) {
            trigger = args[1];
            remainingData = args.slice(2).join(" ").trim();
        } else {
            trigger = results[0].trim();
            remainingData = combined.replace(`"${trigger}"`, "").trim();
        }
    } else {
        trigger = args[1];
        remainingData = args.slice(2).join(" ").trim();
    }
    return {
        trigger: trigger,
        remainingData: remainingData
    };
}

async function mapSingleRole(perm: string): Promise<string[]> {
    const groups: string[] = [];

    const roles = [
        ...customRolesManager.getCustomRoles(),
        ...await teamRolesManager.getTeamRoles()
    ];

    const role = roles.find(r => r.name.toLowerCase() === perm);
    if (role) {
        groups.push(role.id);
        return groups;
    }

    switch (perm) {
        case "all":
        case "everyone":
            break;
        case "sub":
            groups.push("sub");
        case "vip": //eslint-disable-line no-fallthrough
            groups.push("vip");
        case "mod": //eslint-disable-line no-fallthrough
            groups.push("mod");
        case "streamer": //eslint-disable-line no-fallthrough
            groups.push("broadcaster");
            break;
    }

    return groups;
}

async function mapMultipleRoles(permArray: string[]): Promise<string[]> {
    const groups: string[] = [];

    const roles = [
        ...customRolesManager.getCustomRoles(),
        ...await teamRolesManager.getTeamRoles()
    ];

    for (let perm of permArray) {
        perm = perm.trim();

        const role = roles.find(r => r.name.toLowerCase() === perm);
        if (role) {
            groups.push(role.id);
            continue;
        }

        switch (perm) {
            case "all":
            case "everyone":
                break;
            case "sub":
                groups.push("sub");
                break;
            case "vip":
                groups.push("vip");
                break;
            case "mod":
                groups.push("mod");
                break;
            case "streamer":
                groups.push("broadcaster");
                break;
        }
    }

    return groups;
}

async function mapPermArgToRoleIds(permArg: string): Promise<string[]> {
    if (permArg == null || permArg === "") {
        return [];
    }

    const normalizedPerm = permArg.toLowerCase().trim();
    let groups: string[] = [];

    if (normalizedPerm.includes(",")) {
        groups = await mapMultipleRoles(normalizedPerm.split(","));
    } else {
        groups = await mapSingleRole(normalizedPerm);
    }

    return groups;
}

/**
 * The `!command` command
 */
export const CommandManagementSystemCommand: SystemCommand = {
    definition: {
        id: "firebot:commandmanagement",
        name: "Command Management",
        active: true,
        trigger: "!command",
        description: "Allows custom command management via chat.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        },
        restrictionData: {
            restrictions: [
                {
                    id: "sys-cmd-mods-only-perms",
                    type: "firebot:permissions",
                    mode: "roles",
                    roleIds: [
                        "broadcaster",
                        "mod"
                    ]
                }
            ]
        },
        subCommands: [
            {
                arg: "add",
                usage: "add [!trigger or \"phrase\"] [message]",
                description: "Adds a new command with a given response message."
            },
            {
                arg: "import",
                usage: "import [!trigger or \"phrase\"] [shareCode]",
                description: "Imports a command with a share code that was generated by the \"Share effects\" feature."
            },
            {
                arg: "response",
                usage: "response [!trigger or \"phrase\"] [message]",
                description: "Updates the response message for a command. Only works for commands that have 1 or less chat effects."
            },
            {
                arg: "setcount",
                usage: "setcount [!trigger or \"phrase\"] count#",
                description: "Updates the commands usage count.",
                minArgs: 3
            },
            {
                arg: "cooldown",
                usage: "cooldown [!trigger or \"phrase\"] [globalCooldownSecs] [userCooldownSecs]",
                description: "Change the cooldown for a command."
            },
            {
                arg: "restrict",
                usage: "restrict [!trigger or \"phrase\"] [All/Sub/Mod/Streamer/Custom Group]",
                description: "Update permissions for a command."
            },
            {
                arg: "remove",
                usage: "remove [!trigger or \"phrase\"]",
                description: "Removes the given command."
            },
            {
                arg: "description",
                usage: "description [!trigger or \"phrase\"]",
                description: "Updates the description for a command.",
                minArgs: 3
            },
            {
                arg: "enable",
                usage: "enable [!trigger or \"phrase\"]",
                description: "Enables the given custom command."
            },
            {
                arg: "disable",
                usage: "disable [!trigger or \"phrase\"]",
                description: "Disables the given custom command."
            },
            {
                arg: "addalias",
                usage: "addalias [!trigger or \"phrase\"] !alias",
                description: "Adds the specified alias to the given custom command."
            },
            {
                arg: "removealias",
                usage: "removealias [!trigger or \"phrase\"] !alias",
                description: "Removed the specified alias from the given custom command."
            }
        ]
    },
    onTriggerEvent: async (event) => {
        const activeCustomCommands = CommandManager
            .getAllCustomCommands()
            .filter(c => c.active);

        const triggeredArg = event.userCommand.triggeredArg;

        //grab usage
        let usage = event.command.usage ? event.command.usage : "";
        if (triggeredArg != null) {
            const subCommand = event.command.subCommands.find(
                sc => sc.arg === triggeredArg
            );
            if (subCommand != null) {
                usage = subCommand.usage;
            }
        }

        const args = event.userCommand.args;

        if (args.length < 2) {
            await TwitchApi.chat.sendChatMessage(
                `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                null,
                true
            );
            return;
        }

        const { trigger, remainingData } = separateTriggerFromArgs(args);

        if (trigger == null || trigger === "") {
            await TwitchApi.chat.sendChatMessage(
                `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                null,
                true
            );
            return;
        }

        switch (triggeredArg) {
            case "add": {
                if (args.length < 3 || remainingData == null || remainingData === "") {
                    await TwitchApi.chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        null,
                        true
                    );
                    return;
                }

                if (CommandManager.triggerIsTaken(trigger) === true) {
                    await TwitchApi.chat.sendChatMessage(
                        `The trigger '${trigger}' is already in use, please try again.`,
                        null,
                        true
                    );
                    return;
                }

                const canUseEffectVars = SettingsManager.getSetting("AllowChatCreatedCommandsToRunEffects");

                if (!canUseEffectVars && (remainingData.includes("$runEffect") || remainingData.includes("$evalVars"))) {
                    await TwitchApi.chat.sendChatMessage(
                        "Could not add command, \"Allow Chat-Created Commands to Run Effects\" setting is required for included variable(s).",
                        null,
                        true
                    );
                    return;
                }

                const command = {
                    trigger: trigger,
                    autoDeleteTrigger: false,
                    ignoreBot: true,
                    active: true,
                    scanWholeMessage: !trigger.startsWith("!"),
                    cooldown: {
                        user: 0,
                        global: 0
                    },
                    effects: {
                        id: randomUUID(),
                        list: [
                            {
                                id: randomUUID(),
                                type: "firebot:chat",
                                message: remainingData
                            }
                        ]
                    }
                };

                CommandManager.saveCustomCommand(command, event.userCommand.commandSender);

                await TwitchApi.chat.sendChatMessage(
                    `Added command '${trigger}'!`,
                    null,
                    true
                );

                break;
            }

            case "import": {
                if (args.length < 3 || remainingData == null || remainingData === "") {
                    await TwitchApi.chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        null,
                        true
                    );
                    return;
                }

                if (CommandManager.triggerIsTaken(trigger) === true) {
                    await TwitchApi.chat.sendChatMessage(
                        `The trigger '${trigger}' is already in use, please try again.`,
                        null,
                        true
                    );
                    return;
                }

                const canImport = SettingsManager.getSetting("AllowChatCreatedCommandsToRunEffects");

                if (!canImport) {
                    await TwitchApi.chat.sendChatMessage(
                        "Cannot import command, \"Allow Chat-Created Commands to Run Effects\" is disabled in settings.",
                        null,
                        true
                    );
                    return;
                }

                const effectsData = await getData<SharedEffects>(remainingData.trim());

                if (!effectsData || !effectsData.effects) {
                    await TwitchApi.chat.sendChatMessage(
                        `Could not parse effects data, please try again.`,
                        null,
                        true
                    );
                    return;
                }

                const command = {
                    trigger: trigger,
                    autoDeleteTrigger: false,
                    ignoreBot: true,
                    active: true,
                    scanWholeMessage: !trigger.startsWith("!"),
                    cooldown: {
                        user: 0,
                        global: 0
                    },
                    effects: {
                        id: randomUUID(),
                        list: effectsData.effects
                    }
                };

                CommandManager.saveCustomCommand(command, event.userCommand.commandSender);

                await TwitchApi.chat.sendChatMessage(
                    `Imported command '${trigger}'!`,
                    null,
                    true
                );

                break;
            }

            case "response": {
                if (args.length < 3 || remainingData == null || remainingData === "") {
                    await TwitchApi.chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        null,
                        true
                    );
                    return;
                }

                const command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command == null) {
                    await TwitchApi.chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try again.`,
                        null,
                        true
                    );
                    return;
                }

                const canUseEffectVars = SettingsManager.getSetting("AllowChatCreatedCommandsToRunEffects");

                if (!canUseEffectVars && (remainingData.includes("$runEffect") || remainingData.includes("$evalVars"))) {
                    await TwitchApi.chat.sendChatMessage(
                        "Could not update response, \"Allow Chat-Created Commands to Run Effects\" setting is required for included variable(s).",
                        null,
                        true
                    );
                    return;
                }

                const chatEffectsCount = command.effects ? command.effects.list.filter(e => e.type === "firebot:chat").length : 0;

                if (chatEffectsCount > 1) {
                    await TwitchApi.chat.sendChatMessage(
                        `The command '${trigger}' has more than one Chat Effect, preventing the response from being editable via chat.`,
                        null,
                        true
                    );
                    return;
                }
                if (chatEffectsCount === 1) {
                    const chatEffect = command.effects.list.find(e => e.type === "firebot:chat");
                    chatEffect.message = remainingData;
                } else {
                    const chatEffect = {
                        id: randomUUID(),
                        type: "firebot:chat",
                        message: remainingData
                    };
                    command.effects.list.push(chatEffect);
                }

                CommandManager.saveCustomCommand(command, event.userCommand.commandSender);

                await TwitchApi.chat.sendChatMessage(
                    `Updated '${trigger}' with response: ${remainingData}`,
                    null,
                    true
                );

                break;
            }

            case "setcount": {
                const countArg = remainingData.trim();
                const numericCountArg = parseInt(countArg);
                if (countArg === "" || isNaN(numericCountArg)) {
                    await TwitchApi.chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        null,
                        true
                    );
                    return;
                }

                const command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command == null) {
                    await TwitchApi.chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try again.`,
                        null,
                        true
                    );
                    return;
                }

                let newCount = parseInt(countArg);
                if (newCount < 0) {
                    newCount = 0;
                }

                command.count = newCount;

                CommandManager.saveCustomCommand(command, event.userCommand.commandSender);

                await TwitchApi.chat.sendChatMessage(
                    `Updated usage count for '${trigger}' to: ${newCount}`,
                    null,
                    true
                );

                break;
            }

            case "description": {
                const command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command == null) {
                    await TwitchApi.chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try again.`,
                        null,
                        true
                    );
                    return;
                }

                if (remainingData == null || remainingData.length < 1) {
                    await TwitchApi.chat.sendChatMessage(
                        `Please provided a description for '${trigger}'!`,
                        null,
                        true
                    );
                    return;
                }

                command.description = remainingData;

                CommandManager.saveCustomCommand(command, event.userCommand.commandSender);

                await TwitchApi.chat.sendChatMessage(
                    `Updated description for '${trigger}' to: ${remainingData}`,
                    null,
                    true
                );

                break;
            }

            case "cooldown": {
                const cooldownArgs = remainingData.trim().split(" ");
                let globalCooldown = parseInt(cooldownArgs[0]);
                let userCooldown = parseInt(cooldownArgs[1]);
                if (args.length < 3 || remainingData === "" || cooldownArgs.length < 2 || isNaN(globalCooldown)
                    || isNaN(userCooldown)) {
                    await TwitchApi.chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        null,
                        true
                    );
                    return;
                }

                const command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command == null) {
                    await TwitchApi.chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try again.`,
                        null,
                        true
                    );
                    return;
                }

                if (globalCooldown < 0) {
                    globalCooldown = 0;
                }

                if (userCooldown < 0) {
                    userCooldown = 0;
                }

                command.cooldown = {
                    user: userCooldown,
                    global: globalCooldown
                };

                CommandManager.saveCustomCommand(command, event.userCommand.commandSender);

                await TwitchApi.chat.sendChatMessage(
                    `Updated '${trigger}' with cooldowns: ${userCooldown}s (user), ${globalCooldown}s (global)`,
                    null,
                    true
                );

                break;
            }

            case "restrict": {
                if (args.length < 3 || remainingData === "") {
                    await TwitchApi.chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        null,
                        true
                    );
                    return;
                }

                const command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command == null) {
                    await TwitchApi.chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try again.`,
                        null,
                        true
                    );
                    return;
                }

                const restrictions: Restriction[] = [];
                const roleIds = await mapPermArgToRoleIds(remainingData);


                if (roleIds == null || roleIds.length === 0) {
                    await TwitchApi.chat.sendChatMessage(
                        `Please provide a valid group name: All, Sub, Mod, Streamer, or a custom group's name`,
                        null,
                        true
                    );
                    return;
                }

                restrictions.push({
                    id: randomUUID(),
                    type: "firebot:permissions",
                    mode: "roles",
                    roleIds: roleIds
                });

                command.restrictionData = { restrictions: restrictions };

                CommandManager.saveCustomCommand(command, event.userCommand.commandSender);

                await TwitchApi.chat.sendChatMessage(`Updated '${trigger}' restrictions to: ${remainingData}`, null, true);

                break;
            }

            case "remove": {
                const command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command == null) {
                    await TwitchApi.chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try again.`,
                        null,
                        true
                    );
                    return;
                }

                CommandManager.removeCustomCommandByTrigger(trigger);

                await TwitchApi.chat.sendChatMessage(`Successfully removed command '${trigger}'.`, null, true);
                break;
            }

            case "disable":
            case "enable": {
                const command = CommandManager.getAllCustomCommands().find(c => c.trigger === trigger);

                if (command == null) {
                    await TwitchApi.chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try again.`,
                        null,
                        true
                    );
                    return;
                }

                const newActiveStatus = triggeredArg === "enable";

                if (command.active === newActiveStatus) {
                    await TwitchApi.chat.sendChatMessage(
                        `${trigger} is already ${triggeredArg}d.`, null, true
                    );
                    return;
                }

                command.active = newActiveStatus;

                CommandManager.saveCustomCommand(command, event.userCommand.commandSender);

                frontendCommunicator.send("custom-commands-updated");

                await TwitchApi.chat.sendChatMessage(
                    `${capitalize(triggeredArg)}d "${trigger}"`, null, true
                );
                break;
            }

            case "addalias": {
                const alias = remainingData.trim();

                if (args.length < 3 || alias === "") {
                    await TwitchApi.chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        null,
                        true
                    );
                    return;
                }

                const command = CommandManager.getAllCustomCommands().find(c => c.trigger === trigger);

                if (command == null) {
                    await TwitchApi.chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try again.`,
                        null,
                        true
                    );
                    return;
                }

                if (command.aliases == null) {
                    command.aliases = [];
                }

                const aliasIndex = command.aliases.findIndex(a =>
                    a.toLowerCase() === alias.toLowerCase());

                if (aliasIndex > -1) {
                    await TwitchApi.chat.sendChatMessage(
                        `Alias '${alias}' already exists for command with the trigger '${trigger}'.`,
                        null,
                        true
                    );
                    return;
                }

                command.aliases.push(alias);
                CommandManager.saveCustomCommand(command, event.userCommand.commandSender);

                await TwitchApi.chat.sendChatMessage(
                    `Added alias '${alias}' to custom command '${trigger}'!`,
                    null,
                    true
                );

                break;
            }

            case "removealias": {
                const alias = remainingData.trim();

                if (args.length < 3 || alias === "") {
                    await TwitchApi.chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        null,
                        true
                    );
                    return;
                }

                const command = CommandManager.getAllCustomCommands().find(c => c.trigger === trigger);

                if (command == null) {
                    await TwitchApi.chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try again.`,
                        null,
                        true
                    );
                    return;
                }

                if (command.aliases == null) {
                    command.aliases = [];
                }

                const aliasIndex = command.aliases.findIndex(a =>
                    a.toLowerCase() === alias.toLowerCase());

                if (aliasIndex === -1) {
                    await TwitchApi.chat.sendChatMessage(
                        `Alias '${alias}' does not exist for command with the trigger '${trigger}'.`,
                        null,
                        true
                    );
                    return;
                }

                command.aliases.splice(aliasIndex, 1);
                CommandManager.saveCustomCommand(command, event.userCommand.commandSender);

                await TwitchApi.chat.sendChatMessage(
                    `Removed alias '${alias}' from custom command '${trigger}'!`,
                    null,
                    true
                );

                break;
            }
            default:
        }
    }
};