import { CommandDefinition, SystemCommandDefinition, UserCommand } from "../../../types/commands";
import { FirebotChatMessage } from "../../../types/chat";
import { Trigger } from "../../../types/triggers";

import { AccountAccess } from "../../common/account-access";
import { CommandManager } from "./command-manager";
import { RestrictionsManager } from "../../restrictions/restriction-manager";
import { SettingsManager } from "../../common/settings-manager";
import { TwitchApi } from "../../streaming-platforms/twitch/api";
import commandCooldownManager from "./command-cooldown-manager";
import commandRunner from "./command-runner";
import frontendCommunicator from "../../common/frontend-communicator";
import logger from "../../logwrapper";
import { escapeRegExp, humanizeTime } from "../../utils";

const DEFAULT_COOLDOWN_MESSAGE = "This command is still on cooldown for: {timeLeft}";
const DEFAULT_RESTRICTION_MESSAGE = "Sorry, you cannot use this command because: {reason}";

interface CommandMatch {
    command: CommandDefinition | SystemCommandDefinition;
    matchedTrigger?: string;
}

class CommandHandler {
    private _handledMessageIds: string[] = [];

    private buildCommandRegexStr(trigger: string, scanWholeMessage: boolean): string {
        const escapedTrigger = escapeRegExp(trigger);
        if (scanWholeMessage) {
            return `(?:^|\\s)${escapedTrigger}(?!-)(?:\\b|$|(?=\\s))`;
        }
        return `^${escapedTrigger}(?!-)(?:\\b|$|(?=\\s))`;
    }

    private testForTrigger(message: string, trigger: string, scanWholeMessage: boolean, triggerIsRegex: boolean): boolean {
        message = message.toLowerCase();

        const normalizedTrigger = trigger.toLowerCase();
        const commandRegexStr = triggerIsRegex
            ? trigger
            : this.buildCommandRegexStr(normalizedTrigger, scanWholeMessage);

        const regex = new RegExp(commandRegexStr, "gi");

        return regex.test(message);
    }

    private checkForCommand(rawMessage: string): CommandMatch {
        if (rawMessage == null || rawMessage.length < 1) {
            return null;
        }

        const allCommands = CommandManager.getAllActiveCommands();

        for (const command of allCommands) {

            if (this.testForTrigger(
                rawMessage,
                command.trigger,
                command.scanWholeMessage,
                command.triggerIsRegex
            )
            ) {
                return { command, matchedTrigger: command.trigger };
            }

            if (!command.triggerIsRegex && command.aliases != null && Array.isArray(command.aliases)) {
                for (const alias of command.aliases) {
                    if (this.testForTrigger(
                        rawMessage,
                        alias,
                        command.scanWholeMessage,
                        false
                    )) {
                        return { command, matchedTrigger: alias };
                    }
                }
            }
        }
        return { command: null };
    }

    private updateCommandCount(command: CommandDefinition): void {
        command.count = (command.count ?? 0) + 1;

        CommandManager.saveCustomCommand(command);

        frontendCommunicator.send("command-count-update", {
            commandId: command.id,
            count: command.count
        });
    }

    async checkCommandRestrictions(
        firebotChatMessage: FirebotChatMessage,
        command: CommandDefinition,
        userCmd: UserCommand,
        sendFailureMessage = true
    ) {
        const { triggeredSubcmd, commandSender } = userCmd;
        let restrictionData = command.restrictionData;
        let restrictionsAreInherited = false;
        if (triggeredSubcmd) {
            const subCommandHasRestrictions = triggeredSubcmd.restrictionData && triggeredSubcmd.restrictionData.restrictions
                && triggeredSubcmd.restrictionData.restrictions.length > 0;

            if (subCommandHasRestrictions) {
                restrictionData = triggeredSubcmd.restrictionData;
            } else {
                // subcommand has no restrictions, inherit from base command
                restrictionData = command.restrictionData;
                restrictionsAreInherited = true;
            }
        } else {
            restrictionData = command.restrictionData;
        }

        if (restrictionData) {
            logger.debug("Command has restrictions...checking them.");
            const triggerData: Trigger = {
                type: "command",
                metadata: {
                    username: commandSender,
                    userId: firebotChatMessage.userId,
                    userDisplayName: firebotChatMessage.userDisplayName,
                    userTwitchRoles: firebotChatMessage.roles,
                    command: command,
                    userCommand: userCmd,
                    chatMessage: firebotChatMessage
                }
            };
            try {
                await RestrictionsManager.runRestrictionPredicates(triggerData, restrictionData, restrictionsAreInherited);
                logger.debug("Restrictions passed!");
                return true;
            } catch (restrictionReason) {
                let reason: string;
                if (Array.isArray(restrictionReason)) {
                    reason = restrictionReason.join(", ");
                } else {
                    reason = restrictionReason as string;
                }

                logger.debug(`${commandSender} could not use command '${command.trigger}' because: ${reason}`);
                if (restrictionData.sendFailMessage || restrictionData.sendFailMessage == null) {

                    const restrictionMessage = restrictionData.useCustomFailMessage ?
                        restrictionData.failMessage :
                        DEFAULT_RESTRICTION_MESSAGE;

                    if (sendFailureMessage === true) {
                        await TwitchApi.chat.sendChatMessage(
                            restrictionMessage
                                .replaceAll("{user}", commandSender)
                                .replaceAll("{reason}", reason),
                            restrictionData.sendAsReply === true ? firebotChatMessage.id : null,
                            true
                        );
                    }
                }

                return false;
            }
        }
        return true;
    }

    async handleChatMessage(firebotChatMessage: FirebotChatMessage): Promise<{
        ranCommand: boolean;
        command?: CommandDefinition | SystemCommandDefinition;
        userCommand?: UserCommand;
    }> {
        logger.debug("Checking for command in message...");

        const result = {
            ranCommand: false,
            command: null,
            userCommand: null
        };

        // Username of the person that sent the command.
        const commandSender = firebotChatMessage.username;

        // Check to see if handled message array contains the id of this message already.
        // If it does, that means that one of the logged in accounts has already handled the message.
        if (this._handledMessageIds.includes(firebotChatMessage.id)) {
            // We can remove the handled id now, to keep the array small.
            this._handledMessageIds = this._handledMessageIds.filter(id => id !== firebotChatMessage.id);
            return result;
        }
        // throw the message id into the array. This prevents both the bot and the streamer accounts from replying
        this._handledMessageIds.push(firebotChatMessage.id);

        logger.debug("Combining message segments...");
        const rawMessage = firebotChatMessage.rawText;

        // search for and return command if found
        logger.debug("Searching for command...");
        const { command, matchedTrigger } = this.checkForCommand(rawMessage);

        // command wasn't found
        if (command == null) {
            return result;
        }

        // Check whether or not chat message is from shared chat
        // And whether or not shared chat is allowed globally
        // And by the specific command.
        if (firebotChatMessage.isSharedChatMessage) {
            if (command.allowTriggerBySharedChat === false) {
                return result;
            }

            // 'inherit' or undefined = inherit app settings
            if (command.allowTriggerBySharedChat !== true && !SettingsManager.getSetting("AllowCommandsInSharedChat")) {
                return result;
            }
        }

        const { streamer, bot } = AccountAccess.getAccounts();

        // check if chat came from the streamer and if we should ignore it.
        if (command.ignoreStreamer && firebotChatMessage.username === streamer.username) {
            logger.debug("Message came from streamer and this command is set to ignore it");
            return result;
        }

        // check if chat came from the bot and if we should ignore it.
        if (command.ignoreBot && firebotChatMessage.username === bot.username) {
            logger.debug("Message came from bot and this command is set to ignore it");
            return result;
        }

        // check if chat came via whisper and if we should ignore it.
        if (command.ignoreWhispers && firebotChatMessage.whisper) {
            logger.debug("Message came from whisper and this command is set to ignore it");
            return result;
        }

        // build usercommand object
        const userCmd = commandRunner.buildUserCommand(command, rawMessage, commandSender, firebotChatMessage.roles);
        const triggeredSubcmd = userCmd.triggeredSubcmd;

        // update trigger with the one we matched
        userCmd.trigger = matchedTrigger;
        result.command = command;
        result.userCommand = userCmd;

        // command is disabled
        if (triggeredSubcmd && triggeredSubcmd.active === false) {
            logger.debug("This Command is disabled");
            return result;
        }

        if (userCmd.isInvalidSubcommandTrigger === true) {
            await TwitchApi.chat.sendChatMessage(`Invalid Command: unknown arg used.`, null, true);
            return result;
        }

        // Can't auto delete whispers, so we ignore auto delete trigger for those
        if (firebotChatMessage.whisper !== true && command.autoDeleteTrigger || (triggeredSubcmd && triggeredSubcmd.autoDeleteTrigger)) {
            logger.debug("Auto delete trigger is on, attempting to delete chat message");
            await TwitchApi.chat.deleteChatMessage(firebotChatMessage.id);
        }

        // check if command meets min args requirement
        const minArgs = triggeredSubcmd ? triggeredSubcmd.minArgs || 0 : command.minArgs || 0;
        if (userCmd.args.length < minArgs) {
            const usage = triggeredSubcmd ? triggeredSubcmd.usage : command.usage;
            await TwitchApi.chat.sendChatMessage(`Invalid command. Usage: ${command.trigger} ${usage || ""}`, null, true);
            return result;
        }

        logger.debug("Checking cooldowns for command...");
        // Check if the command is on cooldown
        const remainingCooldown = commandCooldownManager.getRemainingCooldown(
            command,
            triggeredSubcmd,
            commandSender
        );

        if (remainingCooldown > 0) {
            logger.debug("Command is still on cooldown, alerting viewer...");
            if (command.sendCooldownMessage || command.sendCooldownMessage == null) {

                const cooldownMessage = command.useCustomCooldownMessage ? command.cooldownMessage : DEFAULT_COOLDOWN_MESSAGE;

                await TwitchApi.chat.sendChatMessage(
                    cooldownMessage
                        .replaceAll("{user}", commandSender)
                        .replaceAll("{timeLeft}", humanizeTime(remainingCooldown)),
                    // We default to replies on purpose here
                    command.sendCooldownMessageAsReply === false ? null : firebotChatMessage.id,
                    true
                );
            }
            return result;
        }

        // Check if command passes all restrictions
        const restrictionsPassed = await this.checkCommandRestrictions(
            firebotChatMessage,
            command,
            userCmd
        );

        if (!restrictionsPassed) {
            return result;
        }

        // If command is not on cooldown AND it passes restrictions, then we can run it. Store the cooldown.
        commandCooldownManager.cooldownCommand(command, triggeredSubcmd, commandSender);

        //update the count for the command
        if (command.type === "custom") {
            logger.debug("Updating command count.");
            this.updateCommandCount(command);
        }

        commandRunner.fireCommand(command, userCmd, firebotChatMessage, commandSender, false);
        result.ranCommand = true;
        return result;
    }
}

const commandHandler = new CommandHandler();

export = commandHandler;