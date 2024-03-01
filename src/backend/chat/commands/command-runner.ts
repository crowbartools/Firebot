import { CommandDefinition, UserCommand } from "../../../types/commands";
import { FirebotChatMessage } from "../../../types/chat";
import { Trigger } from "../../../types/triggers";
import { TriggerType } from "../../common/EffectType";

import logger from "../../logwrapper";
import frontendCommunicator from "../../common/frontend-communicator";
import accountAccess from "../../common/account-access";
import chatHelpers from "../chat-helpers";
import effectRunner from "../../common/effect-runner";
import commandManager from "./command-manager";

interface TriggerWithArgs {
    trigger: string;
    args?: string[];
}

class CommandRunner {
    private parseCommandTriggerAndArgs(trigger: string, rawMessage: string, scanWholeMessage = false, treatQuotedTextAsSingleArg = false): TriggerWithArgs {
        let args = [];

        if (rawMessage != null) {
            let rawArgs = [];

            if (treatQuotedTextAsSingleArg) {
                // Get args
                const quotedArgRegExp = /"([^"]+)"|(\S+)/g;
                rawArgs = rawMessage.match(quotedArgRegExp);

                // Strip surrounding quotes from quoted args
                rawArgs = rawArgs.map(rawArg => rawArg.replace(/^"(.+)"$/, '$1'));
            } else {
                rawArgs = rawMessage.split(" ");
            }

            if (scanWholeMessage) {
                args = rawArgs;
            } else {
                if (rawArgs.length > 0) {
                    trigger = rawArgs[0];
                    args = rawArgs.splice(1);
                }
            }
        }

        args = args.filter(a => a.trim() !== "");

        return { trigger, args };
    }

    buildUserCommand(command: CommandDefinition, rawMessage: string, sender: string, senderRoles?: string[]): UserCommand {
        const { trigger, args } = this.parseCommandTriggerAndArgs(command.trigger, rawMessage, command.scanWholeMessage, command.treatQuotedTextAsSingleArg);

        const userCmd: UserCommand = {
            trigger: trigger,
            args: args,
            commandSender: sender,
            senderRoles: senderRoles ?? []
        };

        if (!command.scanWholeMessage &&
            !command.triggerIsRegex &&
            userCmd.args.length > 0 &&
            command.subCommands?.length > 0) {

            for (const subcmd of command.subCommands) {
                if (subcmd.active === false && command.type !== "system") {
                    continue;
                }
                if (subcmd.regex) {
                    const regex = new RegExp(`^${subcmd.arg}$`, "gi");
                    if (regex.test(userCmd.args[0])) {
                        userCmd.triggeredSubcmd = subcmd;
                        break;
                    }
                } else {
                    if (subcmd.arg.toLowerCase() === userCmd.args[0].toLowerCase()) {
                        userCmd.triggeredSubcmd = subcmd;
                        break;
                    }
                }
            }

            if (command.type !== "system" && userCmd.triggeredSubcmd == null) {
                if (command.fallbackSubcommand == null || !command.fallbackSubcommand.active) {
                    userCmd.isInvalidSubcommandTrigger = true;
                } else {
                    userCmd.triggeredSubcmd = command.fallbackSubcommand;
                }
            }

            if (userCmd.triggeredSubcmd != null) {
                userCmd.triggeredArg = userCmd.triggeredSubcmd.arg;
                userCmd.subcommandId = userCmd.triggeredSubcmd.id;
            }
        }

        return userCmd;
    }

    private execute(command: CommandDefinition, userCommand: UserCommand, firebotChatMessage?: FirebotChatMessage, manual = false) {
        let effects = command.effects;
        if (command.subCommands && command.subCommands.length > 0 && userCommand.subcommandId != null) {
            if (userCommand.subcommandId === "fallback-subcommand" && command.fallbackSubcommand) {
                effects = command.fallbackSubcommand.effects;
            } else {
                const subcommand = command.subCommands.find(sc => sc.id === userCommand.subcommandId);
                if (subcommand) {
                    effects = subcommand.effects;
                }
            }
        }

        const processEffectsRequest = {
            trigger: {
                type: manual ? TriggerType.MANUAL : TriggerType.COMMAND,
                metadata: {
                    username: userCommand.commandSender,
                    userId: undefined,
                    userDisplayName: userCommand.commandSender,
                    command: command,
                    userCommand: userCommand,
                    chatMessage: firebotChatMessage
                }
            },
            effects: effects
        };

        if (firebotChatMessage != null) {
            processEffectsRequest.trigger.metadata.userId = firebotChatMessage.userId;
            processEffectsRequest.trigger.metadata.userDisplayName = firebotChatMessage.userDisplayName;
        }

        return effectRunner.processEffects(processEffectsRequest).catch((reason) => {
            console.log(`error when running effects: ${reason}`);
        });
    }

    fireCommand(
        command: CommandDefinition,
        userCmd: UserCommand,
        firebotChatMessage: FirebotChatMessage,
        commandSender: string,
        isManual = false
    ): void {
        if (command == null) {
            return;
        }
        if (commandSender == null) {
            commandSender = accountAccess.getAccounts().streamer.username;
        }

        logger.info(`Checking command type... ${command.type}`);

        if (command.type === "system") {
            logger.info("Executing system command");
            //get system command from manager
            const cmdDef = commandManager.getSystemCommandById(command.id);

            const commandOptions = {};
            if (command.options != null) {
                for (const optionName of Object.keys(command.options)) {
                    const option = command.options[optionName];
                    if (option) {
                        commandOptions[optionName] = option.value ?? option.default;
                    }
                }
            }

            //call trigger event.
            cmdDef.onTriggerEvent({
                command: command,
                commandOptions: commandOptions,
                userCommand: userCmd,
                chatMessage: firebotChatMessage
            });
        }
        if (command.effects) {
            logger.info("Executing command effects");
            this.execute(command, userCmd, firebotChatMessage, isManual);
        }
    }

    triggerCustomCommand(id: string, isManual = true): void {
        const command = commandManager.getCustomCommandById(id);
        if (command != null) {
            console.log("firing command manually", command);
            const commandSender = accountAccess.getAccounts().streamer.username,
                userCmd = this.buildUserCommand(command, null, commandSender);
            this.fireCommand(command, userCmd, null, commandSender, isManual);
        }
    }

    private runCommandFromEffect(command: CommandDefinition, trigger: Trigger, args: string[]): void {
        const message = `${command.trigger} ${args}`;
        const firebotChatMessage = chatHelpers.buildBasicFirebotChatMessage(message, trigger.metadata.username);

        if (command != null) {
            const userCmd = this.buildUserCommand(command, message, trigger.metadata.username);
            this.fireCommand(command, userCmd, firebotChatMessage, trigger.metadata.username, false);
        }
    }

    runSystemCommandFromEffect(id: string, trigger: Trigger, args: string[]): void {
        const command = commandManager.getSystemCommandById(id).definition;
        this.runCommandFromEffect(command, trigger, args);
    }

    runCustomCommandFromEffect(id: string, trigger: Trigger, args: string[]): void {
        const command = commandManager.getCustomCommandById(id);
        this.runCommandFromEffect(command, trigger, args);
    }
}

const commandRunner = new CommandRunner();

frontendCommunicator.on("command-manual-trigger", (id: string): void => {
    commandRunner.triggerCustomCommand(id, true);
});

export = commandRunner;