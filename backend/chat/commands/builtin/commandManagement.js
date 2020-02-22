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
    if (permArg == null || permArg === "") return false;

    let normalizedPerm = permArg.toLowerCase().trim(),
        groups = [];

    switch (normalizedPerm) {
    case "all":
    case "everyone":
        return null;
    case "sub":
        groups.push("Subscriber");
    case "mod": // eslint-disable-line no-fallthrough
        groups.push("Mod");
        groups.push("ChannelEditor");
    case "streamer": // eslint-disable-line no-fallthrough
        groups.push("Owner");
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
        autoDeleteTrigger: true,
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
                        "ChannelEditor",
                        "Owner"
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
            }
        ]
    },
    /**
   * When the command is triggered
   */
    onTriggerEvent: event => {
        return new Promise(async (resolve) => {
            const commandManager = require("../CommandManager");
            const Chat = require("../../../common/mixer-chat");

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
                Chat.smartSend(
                    `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                    event.userCommand.commandSender
                );
                return resolve();
            }

            let { trigger, remainingData } = seperateTriggerFromArgs(args);

            if (trigger == null || trigger === "") {
                Chat.smartSend(
                    `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                    event.userCommand.commandSender
                );
                return resolve();
            }

            switch (triggeredArg) {
            case "add": {
                if (args.length < 3 || remainingData == null || remainingData === "") {
                    Chat.smartSend(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                if (commandManager.triggerIsTaken(trigger)) {
                    Chat.smartSend(
                        `The trigger '${trigger}' has already been taken, please try again.`,
                        event.userCommand.commandSender
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

                Chat.smartSend(
                    `Added command '${trigger}' with response: ${remainingData}`
                );

                break;
            }
            case "response": {
                if (args.length < 3 || remainingData == null || remainingData === "") {
                    Chat.smartSend(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command === null) {
                    Chat.smartSend(
                        `Could not find a command with the trigger '${trigger}', please try agian.`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let chatEffectsCount = command.effects ? command.effects.list.filter(e => e.type === "firebot:chat").length : 0;

                if (chatEffectsCount > 1) {
                    Chat.smartSend(
                        `The command '${trigger}' has more than one Chat Effect, preventing the response from being editable via chat.`,
                        event.userCommand.commandSender
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

                Chat.smartSend(
                    `Updated '${trigger}' with response: ${remainingData}`
                );

                break;
            }
            case "setcount": {
                let countArg = remainingData.trim();
                if (countArg === "" || isNaN(countArg)) {
                    Chat.smartSend(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command === null) {
                    Chat.smartSend(
                        `Could not find a command with the trigger '${trigger}', please try agian.`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let newCount = parseInt(countArg);
                if (newCount < 0) {
                    newCount = 0;
                }

                command.count = parseInt(newCount);

                commandManager.saveCustomCommand(command, event.userCommand.commandSender, false);

                Chat.smartSend(
                    `Updated useage count for '${trigger}' to: ${newCount}`
                );

                break;
            }
            case "cooldown": {
                let cooldownArgs = remainingData.trim().split(" ");
                if (args.length < 3 || remainingData === "" || cooldownArgs.length < 2 || isNaN(cooldownArgs[0])
                    || isNaN(cooldownArgs[1])) {
                    Chat.smartSend(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command === null) {
                    Chat.smartSend(
                        `Could not find a command with the trigger '${trigger}', please try again.`,
                        event.userCommand.commandSender
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

                Chat.smartSend(
                    `Updated '${trigger}' with cooldowns: ${userCooldown}s (user), ${globalCooldown}s (global)`
                );

                break;
            }
            case "restrict": {
                if (args.length < 3 || remainingData === "") {
                    Chat.smartSend(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command === null) {
                    Chat.smartSend(
                        `Could not find a command with the trigger '${trigger}', please try again.`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let restrictions = [];
                let roleIds = mapPermArgToRoleIds(remainingData);


                if (roleIds === false) {
                    Chat.smartSend(
                        `Please provide a valid group name: All, Sub, Mod, Streamer, or a custom group's name`,
                        event.userCommand.commandSender
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

                Chat.smartSend(`Updated '${trigger}' restrictions to: ${remainingData}`);

                break;
            }
            case "remove": {

                let command = activeCustomCommands.find(c => c.trigger === trigger);
                if (command === null) {
                    Chat.smartSend(
                        `Could not find a command with the trigger '${trigger}', please try agian.`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                commandManager.removeCustomCommandByTrigger(trigger);

                Chat.smartSend(`Successfully removed command '${trigger}'.`);
                break;
            }
            default:
            }

            resolve();
        });
    }
};

module.exports = commandManagement;
