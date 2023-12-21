"use strict";

const uuidv1 = require("uuid/v1");
const util = require("../../../utility");
const frontendCommunicator = require("../../../common/frontend-communicator");
const customRolesManager = require("../../../roles/custom-roles-manager");
const teamRolesManager = require("../../../roles/team-roles-manager");

function seperateTriggerFromArgs(args) {
    let trigger, remainingData = "";
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

const mapSingleRole = async (perm) => {
    const groups = [];

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
};

const mapMultipleRoles = async (permArray) => {
    const groups = [];

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
};

const mapPermArgToRoleIds = async (permArg) => {
    if (permArg == null || permArg === "") {
        return [];
    }

    const normalizedPerm = permArg.toLowerCase().trim();
    let groups = [];

    if (normalizedPerm.includes(",")) {
        groups = await mapMultipleRoles(normalizedPerm.split(","));
    } else {
        groups = await mapSingleRole(normalizedPerm);
    }

    return groups;
};

/**
 * The Command List command
 */
const commandManagement = {
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
    /**
   * When the command is triggered
   */
    onTriggerEvent: event => {
        return new Promise(async (resolve) => {
            const commandManager = require("../CommandManager");
            const chat = require("../../twitch-chat");

            const activeCustomCommands = commandManager
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
                await chat.sendChatMessage(
                    `Invalid command. Usage: ${event.command.trigger} ${usage}`);
                return resolve();
            }

            const { trigger, remainingData } = seperateTriggerFromArgs(args);

            if (trigger == null || trigger === "") {
                await chat.sendChatMessage(
                    `Invalid command. Usage: ${event.command.trigger} ${usage}`
                );
                return resolve();
            }

            switch (triggeredArg) {
                case "add": {
                    if (args.length < 3 || remainingData == null || remainingData === "") {
                        await chat.sendChatMessage(
                            `Invalid command. Usage: ${event.command.trigger} ${usage}`
                        );
                        return resolve();
                    }

                    if (commandManager.triggerIsTaken(trigger)) {
                        await chat.sendChatMessage(
                            `The trigger '${trigger}' is already in use, please try again.`
                        );
                        return resolve();
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
                            id: uuidv1(),
                            list: [
                                {
                                    id: uuidv1(),
                                    type: "firebot:chat",
                                    message: remainingData
                                }
                            ]
                        }
                    };

                    commandManager.saveCustomCommand(command, event.userCommand.commandSender);

                    await chat.sendChatMessage(
                        `Added command '${trigger}'!`
                    );

                    break;
                }
                case "response": {
                    if (args.length < 3 || remainingData == null || remainingData === "") {
                        await chat.sendChatMessage(
                            `Invalid command. Usage: ${event.command.trigger} ${usage}`
                        );
                        return resolve();
                    }

                    const command = activeCustomCommands.find(c => c.trigger === trigger);
                    if (command == null) {
                        await chat.sendChatMessage(
                            `Could not find a command with the trigger '${trigger}', please try again.`
                        );
                        return resolve();
                    }

                    const chatEffectsCount = command.effects ? command.effects.list.filter(e => e.type === "firebot:chat").length : 0;

                    if (chatEffectsCount > 1) {
                        await chat.sendChatMessage(
                            `The command '${trigger}' has more than one Chat Effect, preventing the response from being editable via chat.`
                        );
                        return resolve();
                    }
                    if (chatEffectsCount === 1) {
                        const chatEffect = command.effects.list.find(e => e.type === "firebot:chat");
                        chatEffect.message = remainingData;
                    } else {
                        const chatEffect = {
                            id: uuidv1(),
                            type: "firebot:chat",
                            message: remainingData
                        };
                        command.effects.list.push(chatEffect);
                    }

                    commandManager.saveCustomCommand(command, event.userCommand.commandSender, false);

                    await chat.sendChatMessage(
                        `Updated '${trigger}' with response: ${remainingData}`
                    );

                    break;
                }
                case "setcount": {
                    const countArg = remainingData.trim();
                    if (countArg === "" || isNaN(countArg)) {
                        await chat.sendChatMessage(
                            `Invalid command. Usage: ${event.command.trigger} ${usage}`
                        );
                        return resolve();
                    }

                    const command = activeCustomCommands.find(c => c.trigger === trigger);
                    if (command == null) {
                        await chat.sendChatMessage(
                            `Could not find a command with the trigger '${trigger}', please try again.`
                        );
                        return resolve();
                    }

                    let newCount = parseInt(countArg);
                    if (newCount < 0) {
                        newCount = 0;
                    }

                    command.count = parseInt(newCount);

                    commandManager.saveCustomCommand(command, event.userCommand.commandSender, false);

                    await chat.sendChatMessage(
                        `Updated usage count for '${trigger}' to: ${newCount}`
                    );

                    break;
                }
                case "description": {

                    const command = activeCustomCommands.find(c => c.trigger === trigger);
                    if (command == null) {
                        await chat.sendChatMessage(
                            `Could not find a command with the trigger '${trigger}', please try again.`
                        );
                        return resolve();
                    }

                    if (remainingData == null || remainingData.length < 1) {
                        await chat.sendChatMessage(
                            `Please provided a description for '${trigger}'!`
                        );
                        return resolve();
                    }

                    command.description = remainingData;

                    commandManager.saveCustomCommand(command, event.userCommand.commandSender, false);

                    await chat.sendChatMessage(
                        `Updated description for '${trigger}' to: ${remainingData}`
                    );

                    break;
                }
                case "cooldown": {
                    const cooldownArgs = remainingData.trim().split(" ");
                    if (args.length < 3 || remainingData === "" || cooldownArgs.length < 2 || isNaN(cooldownArgs[0])
                    || isNaN(cooldownArgs[1])) {
                        await chat.sendChatMessage(
                            `Invalid command. Usage: ${event.command.trigger} ${usage}`
                        );
                        return resolve();
                    }

                    const command = activeCustomCommands.find(c => c.trigger === trigger);
                    if (command == null) {
                        await chat.sendChatMessage(
                            `Could not find a command with the trigger '${trigger}', please try again.`
                        );
                        return resolve();
                    }

                    let globalCooldown = parseInt(cooldownArgs[0]),
                        userCooldown = parseInt(cooldownArgs[1]);

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

                    commandManager.saveCustomCommand(command, event.userCommand.commandSender, false);

                    await chat.sendChatMessage(
                        `Updated '${trigger}' with cooldowns: ${userCooldown}s (user), ${globalCooldown}s (global)`
                    );

                    break;
                }
                case "restrict": {
                    if (args.length < 3 || remainingData === "") {
                        await chat.sendChatMessage(
                            `Invalid command. Usage: ${event.command.trigger} ${usage}`
                        );
                        return resolve();
                    }

                    const command = activeCustomCommands.find(c => c.trigger === trigger);
                    if (command == null) {
                        await chat.sendChatMessage(
                            `Could not find a command with the trigger '${trigger}', please try again.`
                        );
                        return resolve();
                    }

                    const restrictions = [];
                    const roleIds = await mapPermArgToRoleIds(remainingData);


                    if (roleIds === false) {
                        await chat.sendChatMessage(
                            `Please provide a valid group name: All, Sub, Mod, Streamer, or a custom group's name`
                        );
                        return resolve();
                    }

                    if (roleIds != null) {
                        restrictions.push({
                            id: uuidv1(),
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: roleIds
                        });
                    }

                    command.restrictionData = { restrictions: restrictions };

                    commandManager.saveCustomCommand(command, event.userCommand.commandSender, false);

                    await chat.sendChatMessage(`Updated '${trigger}' restrictions to: ${remainingData}`);

                    break;
                }
                case "remove": {

                    const command = activeCustomCommands.find(c => c.trigger === trigger);
                    if (command == null) {
                        await chat.sendChatMessage(
                            `Could not find a command with the trigger '${trigger}', please try again.`
                        );
                        return resolve();
                    }

                    commandManager.removeCustomCommandByTrigger(trigger);

                    await chat.sendChatMessage(`Successfully removed command '${trigger}'.`);
                    break;
                }
                case "disable":
                case "enable": {
                    const command = commandManager.getAllCustomCommands().find(c => c.trigger === trigger);

                    if (command == null) {
                        await chat.sendChatMessage(
                            `Could not find a command with the trigger '${trigger}', please try again.`
                        );
                        return resolve();
                    }

                    const newActiveStatus = triggeredArg === "enable";

                    if (command.active === newActiveStatus) {
                        await chat.sendChatMessage(
                            `${trigger} is already ${triggeredArg}d.`
                        );
                        return resolve();
                    }

                    command.active = newActiveStatus;

                    commandManager.saveCustomCommand(command, event.userCommand.commandSender, false);

                    frontendCommunicator.send("custom-commands-updated");

                    await chat.sendChatMessage(
                        `${util.capitalize(triggeredArg)}d "${trigger}"`
                    );
                    break;
                }
                case "addalias": {
                    const alias = remainingData.trim();

                    if (args.length < 3 || alias === "") {
                        await chat.sendChatMessage(
                            `Invalid command. Usage: ${event.command.trigger} ${usage}`
                        );
                        return resolve();
                    }

                    const command = commandManager.getAllCustomCommands().find(c => c.trigger === trigger);

                    if (command == null) {
                        await chat.sendChatMessage(
                            `Could not find a command with the trigger '${trigger}', please try again.`
                        );
                        return resolve();
                    }

                    const aliasIndex = command.aliases.findIndex((a) =>
                        a.toLowerCase() === alias.toLowerCase());

                    if (aliasIndex > -1) {
                        await chat.sendChatMessage(
                            `Alias '${alias}' already exists for command with the trigger '${trigger}'.`
                        );
                        return resolve();
                    }

                    command.aliases.push(alias);
                    commandManager.saveCustomCommand(command, event.userCommand.commandSender);

                    await chat.sendChatMessage(
                        `Added alias '${alias}' to custom command '${trigger}'!`
                    );

                    break;
                }
                case "removealias": {
                    const alias = remainingData.trim();

                    if (args.length < 3 || alias === "") {
                        await chat.sendChatMessage(
                            `Invalid command. Usage: ${event.command.trigger} ${usage}`
                        );
                        return resolve();
                    }

                    const command = commandManager.getAllCustomCommands().find(c => c.trigger === trigger);

                    if (command == null) {
                        await chat.sendChatMessage(
                            `Could not find a command with the trigger '${trigger}', please try again.`
                        );
                        return resolve();
                    }

                    const aliasIndex = command.aliases.findIndex((a) =>
                        a.toLowerCase() === alias.toLowerCase());

                    if (aliasIndex === -1) {
                        await chat.sendChatMessage(
                            `Alias '${alias}' does not exist for command with the trigger '${trigger}'.`
                        );
                        return resolve();
                    }

                    command.aliases.splice(aliasIndex, 1);
                    commandManager.saveCustomCommand(command, event.userCommand.commandSender);

                    await chat.sendChatMessage(
                        `Removed alias '${alias}' from custom command '${trigger}'!`
                    );

                    break;
                }
                default:
            }

            resolve();
        });
    }
};

module.exports = commandManagement;
