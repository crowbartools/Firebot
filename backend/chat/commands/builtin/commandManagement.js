"use strict";

const uuidv1 = require("uuid/v1");


function seperateTriggerFromArgs(args) {
    let trigger, remainingData = "";
    if (args[1].startsWith("\"")) {
        let combined = args.slice(1).join(" ");
        let quotedTriggerRegex = /(?<=(?:\s|^)")(?:[^"]|(?:\\"))*(?=(?:(?:"(?<!\\"))(?:\s|$)))/i;
        let results = quotedTriggerRegex.exec(combined);

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

function mapPermArgToRoleIds(permArg) {
    if (permArg == null || permArg === "") return [];

    let normalizedPerm = permArg.toLowerCase().trim(),
        groups = [];

    switch (normalizedPerm) {
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

    return groups;
}

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

            let activeCustomCommands = commandManager
                .getAllCustomCommands()
                .filter(c => c.active);

            let triggeredArg = event.userCommand.triggeredArg;

            //grab usage
            let usage = event.command.usage ? event.command.usage : "";
            if (triggeredArg != null) {
                let subCommand = event.command.subCommands.find(
                    sc => sc.arg === triggeredArg
                );
                if (subCommand != null) {
                    usage = subCommand.usage;
                }
            }

            let args = event.userCommand.args;

            if (args.length < 2) {
                chat.sendChatMessage(
                    `Invalid command. Usage: ${event.command.trigger} ${usage}`);
                return resolve();
            }

            let { trigger, remainingData } = seperateTriggerFromArgs(args);

            if (trigger == null || trigger === "") {
                chat.sendChatMessage(
                    `Invalid command. Usage: ${event.command.trigger} ${usage}`
                );
                return resolve();
            }

            switch (triggeredArg) {
            case "add": {
                if (args.length < 3 || remainingData == null || remainingData === "") {
                    chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`
                    );
                    return resolve();
                }

                if (commandManager.triggerIsTaken(trigger)) {
                    chat.sendChatMessage(
                        `The trigger '${trigger}' is already in use, please try again.`
                    );
                    return resolve();
                }

                let command = {
                    trigger: trigger,
                    autoDeleteTrigger: false,
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

                chat.sendChatMessage(
                    `Added command '${trigger}'!`
                );

                break;
            }
            case "response": {
                if (args.length < 3 || remainingData == null || remainingData === "") {
                    chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`
                    );
                    return resolve();
                }

                let command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command === null) {
                    chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try agian.`
                    );
                    return resolve();
                }

                let chatEffectsCount = command.effects ? command.effects.list.filter(e => e.type === "firebot:chat").length : 0;

                if (chatEffectsCount > 1) {
                    chat.sendChatMessage(
                        `The command '${trigger}' has more than one Chat Effect, preventing the response from being editable via chat.`
                    );
                    return resolve();
                }
                if (chatEffectsCount === 1) {
                    let chatEffect = command.effects.list.find(e => e.type === "firebot:chat");
                    chatEffect.message = remainingData;
                } else {
                    let chatEffect = {
                        id: uuidv1(),
                        type: "firebot:chat",
                        message: remainingData
                    };
                    command.effects.list.push(chatEffect);
                }

                commandManager.saveCustomCommand(command, event.userCommand.commandSender, false);

                chat.sendChatMessage(
                    `Updated '${trigger}' with response: ${remainingData}`
                );

                break;
            }
            case "setcount": {
                let countArg = remainingData.trim();
                if (countArg === "" || isNaN(countArg)) {
                    chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`
                    );
                    return resolve();
                }

                let command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command === null) {
                    chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try agian.`
                    );
                    return resolve();
                }

                let newCount = parseInt(countArg);
                if (newCount < 0) {
                    newCount = 0;
                }

                command.count = parseInt(newCount);

                commandManager.saveCustomCommand(command, event.userCommand.commandSender, false);

                chat.sendChatMessage(
                    `Updated usage count for '${trigger}' to: ${newCount}`
                );

                break;
            }
            case "description": {

                const command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command === null) {
                    chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try again.`
                    );
                    return resolve();
                }

                if (remainingData == null || remainingData.length < 1) {
                    chat.sendChatMessage(
                        `Please provided a description for '${trigger}'!`
                    );
                    return resolve();
                }

                command.description = remainingData;

                commandManager.saveCustomCommand(command, event.userCommand.commandSender, false);

                chat.sendChatMessage(
                    `Updated description for '${trigger}' to: ${remainingData}`
                );

                break;
            }
            case "cooldown": {
                let cooldownArgs = remainingData.trim().split(" ");
                if (args.length < 3 || remainingData === "" || cooldownArgs.length < 2 || isNaN(cooldownArgs[0])
                    || isNaN(cooldownArgs[1])) {
                    chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`
                    );
                    return resolve();
                }

                let command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command === null) {
                    chat.sendChatMessage(
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

                chat.sendChatMessage(
                    `Updated '${trigger}' with cooldowns: ${userCooldown}s (user), ${globalCooldown}s (global)`
                );

                break;
            }
            case "restrict": {
                if (args.length < 3 || remainingData === "") {
                    chat.sendChatMessage(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`
                    );
                    return resolve();
                }

                let command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command === null) {
                    chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try again.`
                    );
                    return resolve();
                }

                let restrictions = [];
                let roleIds = mapPermArgToRoleIds(remainingData);


                if (roleIds === false) {
                    chat.sendChatMessage(
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

                chat.sendChatMessage(`Updated '${trigger}' restrictions to: ${remainingData}`);

                break;
            }
            case "remove": {

                let command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command === null) {
                    chat.sendChatMessage(
                        `Could not find a command with the trigger '${trigger}', please try agian.`
                    );
                    return resolve();
                }

                commandManager.removeCustomCommandByTrigger(trigger);

                chat.sendChatMessage(`Successfully removed command '${trigger}'.`);
                break;
            }
            default:
            }

            resolve();
        });
    }
};

module.exports = commandManagement;
