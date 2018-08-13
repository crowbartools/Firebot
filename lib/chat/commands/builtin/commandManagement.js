"use strict";


function seperateTriggerFromArgs(args) {
    let trigger, remainingData;
    if (args[1].startsWith("\"")) {
        let combined = args.slice(1).join(" ");
        let quotedTriggerRegex = /(?<=(?:\s|^)")(?:[^"]|(?:\\"))*(?=(?:(?:"(?<!\\"))(?:\s|$)))/i;
        let results = quotedTriggerRegex.exec(combined);

        if (results === null) {
            trigger = args[1];
            remainingData = args.slice(2).join(" ");
        } else {
            trigger = results[0].trim();
            remainingData = combined.replace(`"${trigger}"`, "").trim();
        }
    } else {
        trigger = args[1];
        remainingData = args.slice(2).join(" ");
    }
    return {
        trigger: trigger,
        remainingData: remainingData
    };
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
        permission: {
            type: "group",
            groups: ["Channel Editors", "Streamer"]
        },
        subCommands: [
            {
                arg: "add",
                usage: "add [!trigger or word] [message]",
                description: "Adds a new command with a given response message."
            },
            {
                arg: "response",
                usage: "response [!trigger or word] [message]",
                description:
          "Updates the response message for a command. Only works for commands that have 1 or less chat effects."
            },
            {
                arg: "cooldown",
                usage: "cooldown [!trigger or word] [globalCooldown] [userCooldown]",
                description: "Change the cooldown for a command."
            },
            {
                arg: "restrict",
                usage:
          "restrict [!trigger or word] [All/Sub/Mod/ChannelEditor/Streamer]",
                description: "Update permissions for a command."
            },
            {
                arg: "remove",
                usage: "remove [!trigger or word]",
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

            switch (triggeredArg) {
            case "add": {
                if (args.length < 3) {
                    Chat.smartSend(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let { trigger, remainingData } = seperateTriggerFromArgs(args);

                if (trigger == null || trigger === "" || remainingData == null || remainingData === "") {
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
                    permission: {
                        type: "none"
                    },
                    effects: [
                        {
                            id: "firebot:chat",
                            message: remainingData
                        }
                    ]
                };

                commandManager.saveCustomCommand(command, event.userCommand.commandSender);

                Chat.smartSend(
                    `Added command '${trigger}' with response: ${remainingData}`
                );

                break;
            }
            case "response": {
                if (args.length < 3) {
                    Chat.smartSend(
                        `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }

                let { trigger, remainingData } = seperateTriggerFromArgs(args);

                if (trigger == null || trigger === "" || remainingData == null || remainingData === "") {
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

                let chatEffectsCount = command.effects.filter(e => e.id === "firebot:chat").length;

                if (chatEffectsCount > 1) {
                    Chat.smartSend(
                        `The command '${trigger}' has more than one Chat Effect, preventing the response from being editable via chat.`,
                        event.userCommand.commandSender
                    );
                    return resolve();
                }
                if (chatEffectsCount === 1) {
                    let chatEffect = command.effects.find(e => e.id === "firebot:chat");
                    chatEffect.message = remainingData;
                } else {
                    let chatEffect = {
                        id: "firebot:chat",
                        message: remainingData
                    };
                    command.effects.push(chatEffect);
                }

                commandManager.saveCustomCommand(command, event.userCommand.commandSender, false);

                Chat.smartSend(
                    `Updated command '${trigger}' with response: ${remainingData}`
                );

                break;
            }
            case "cooldown": {
                break;
            }
            case "restrict": {
                break;
            }
            case "remove": {
                let { trigger } = seperateTriggerFromArgs(args);

                if (trigger == null || trigger === "") {
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

                commandManager.removeCustomCommandByTrigger(trigger);

                Chat.smartSend(
                    `Successfully removed command '${trigger}'.`
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
